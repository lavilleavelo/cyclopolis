const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

(function checkDataHealth() {
  const links = getAllLinks();
  checkJsonFilesAreValid();
  checkGeoJsonDataHealth({ links });
  checkCompteursDataHealth();
})();

function checkJsonFilesAreValid(directory = 'content') {
  fs.readdirSync(directory).forEach((file) => {
    const filePath = path.join(directory, file);

    if (fs.statSync(filePath).isDirectory()) {
      checkJsonFilesAreValid(filePath);
    } else if (file.endsWith('.json')) {
      try {
        JSON.parse(fs.readFileSync(filePath));
      } catch (error) {
        console.error(`Invalid JSON file: ${filePath}`, error);
        process.exit(1);
      }
    }
  });
}

function getAllLinks() {
  const links = [];
  const titleRegex = /^(#+)\s+(.*)/gm;

  fs.readdirSync('content/voies-cyclables').forEach((file) => {
    if (file.endsWith('.md')) {
      const voieLyonnaiseNumber = file.match(/\d+/g);

      const filePath = path.join('content/voies-cyclables', file);
      const markdownContent = fs.readFileSync(filePath, 'utf8');

      let match;
      while ((match = titleRegex.exec(markdownContent)) !== null) {
        // Extracting the title
        const title = match[2];
        // Remove HTML tags if any
        const cleanTitle = title
          .replace(/<\/?[^>]+(>|$)/g, '')
          .replace(/\//g, '')
          .replace(/[(),*']/g, '');

        // Replace spaces with hyphens and convert to lower case
        const link = cleanTitle
          .trim()
          .toLowerCase()
          .replace(/\s+-\s+/g, '-')
          .replace(/\s+/g, '-');
        links.push(`/${config.slug}-${voieLyonnaiseNumber}#${link}`);
      }
    }
  });

  return links;
}

function checkGeoJsonDataHealth({ links }) {
  const allLineStrings = [];
  fs.readdirSync('content/voies-cyclables').forEach((file) => {
    if (file.endsWith('.json')) {
      const filePath = path.join('content/voies-cyclables', file);
      const content = fs.readFileSync(filePath, 'utf8');
      try {
        const geojson = JSON.parse(content);

        if (geojson.type === 'FeatureCollection') {
          for (const feature of geojson.features) {
            if (feature.geometry.type === 'LineString') {
              allLineStrings.push(feature);
              // 2 - check if all properties are present
              const properties = feature.properties || {};
              const requiredKeys = ['line', 'name', 'status', 'quality'];
              for (const key of requiredKeys) {
                if (!Object.hasOwn(properties, key)) {
                  console.error(`Missing key '${key}' in LineString properties of file: ${filePath}`);
                  process.exit(1);
                }
              }

              // 3.1 - check if status is valid
              const validStatus = [
                'done',
                'wip',
                'planned',
                'tested',
                'postponed',
                'unknown',
                'variante',
                'variante-postponed',
              ];
              if (!validStatus.includes(properties.status)) {
                console.error(`Invalid status '${properties.status}' in LineString properties of file: ${filePath}`);
                process.exit(1);
              }

              // 3.2 - check if quality is valid
              const validQuality = ['satisfactory', 'unsatisfactory'];
              if (!validQuality.includes(properties.quality)) {
                console.error(`Invalid quality '${properties.quality}' in LineString properties of file: ${filePath}`);
                process.exit(1);
              }

              if (properties.status === 'done') {
                // 4.1 - Check if all done section have a doneAt property
                if (!Object.hasOwn(properties, 'doneAt')) {
                  console.error(`Missing key 'doneAt' in VL ${properties.line}, tronçon: ${properties.name}`);
                  process.exit(1);
                }

                // 4.2 - Check if all done section have a valid doneAt date
                const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
                if (!dateRegex.test(properties.doneAt)) {
                  console.error(
                    `Invalid doneAt format '${properties.doneAt}' in VL ${properties.line}, tronçon: ${properties.name}`,
                  );
                  process.exit(1);
                }
              }

              // 4.3 - Check if all sections have a type property
              const validTypes = [
                'bidirectionnelle',
                'bilaterale',
                'voie-bus',
                'voie-bus-elargie',
                'velorue',
                'voie-verte',
                'bandes-cyclables',
                'zone-de-rencontre',
                'inconnu',
                'aucun',
              ];
              if (!validTypes.includes(properties.type)) {
                console.error(`Invalid type '${properties.type}' in LineString properties of file: ${filePath}`);
                process.exit(1);
              }

              // 5 - check if link actually exists
              if (!properties.link) {
                console.error(`Missing link in LineString properties of file: ${filePath}`);
                process.exit(1);
              }
              if (!links.includes(properties.link)) {
                console.error(`Invalid link '${properties.link}' in LineString properties of file: ${filePath}`);
                process.exit(1);
              }
            } else if (feature.geometry.type === 'Point') {
              const properties = feature.properties || {};

              if (properties.type === 'danger') {
                // danger icons added to the map at high zoom level
                const requiredKeys = ['type', 'name'];
                for (const key of requiredKeys) {
                  if (!Object.hasOwn(properties, key)) {
                    console.error(`Missing key '${key}' in danger properties of file: ${filePath}`);
                    process.exit(1);
                  }
                }
              } else if (properties.type === 'perspective') {
                // perspective images added to the map at high zoom level
                const requiredKeys = ['type', 'line', 'name', 'imgUrl'];
                for (const key of requiredKeys) {
                  if (!Object.hasOwn(properties, key)) {
                    console.error(`Missing key '${key}' in perspective properties of file: ${filePath}`);
                    process.exit(1);
                  }
                }
              } else {
                console.error(`Invalid type '${properties.type}' in Point properties of file: ${filePath}`);
                process.exit(1);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error parsing GeoJSON file: ${filePath}`, error);
        process.exit(1);
      }
    }
  });

  // 5 - Check if all properties.id exists at least twice
  const idsCount = allLineStrings.reduce((count, lineString) => {
    const id = lineString.properties.id;
    count[id] = (count[id] || 0) + 1;
    return count;
  }, {});
  for (const id in idsCount) {
    if (idsCount[id] < 2) {
      console.error(`Missing LineString with id '${id}'`);
      process.exit(1);
    }
  }

  // 6 - Check if all properties.name x properties.line is unique
  const nameLineCount = allLineStrings.reduce((count, lineString) => {
    const name = lineString.properties.name;
    const line = lineString.properties.line;
    const key = `${name}-${line}`;
    count[key] = (count[key] || 0) + 1;
    return count;
  }, {});
  for (const id in nameLineCount) {
    if (nameLineCount[id] > 1) {
      console.error(`Duplicate LineString with name-line '${id}'`);
      process.exit(1);
    }
  }
}

function checkCompteursDataHealth() {
  fs.readdirSync('content/compteurs').forEach((file) => {
    if (file.endsWith('.json')) {
      const filePath = path.join('content/compteurs', file);
      const content = fs.readFileSync(filePath, 'utf8');

      const compteur = JSON.parse(content);
      const requiredKeys = ['name', 'description', 'arrondissement', 'idPdc', 'coordinates', 'counts'];
      for (const key of requiredKeys) {
        if (!Object.hasOwn(compteur, key)) {
          console.error(`Missing key '${key}' in Compteur properties of file: ${filePath}`);
          process.exit(1);
        }
      }
    }
  });
}
