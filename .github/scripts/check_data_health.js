const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

const LINES_DIRECTORY = 'content/voies-cyclables';
const OTHER_NETWORKS_DIRECTORY = 'content/autres-reseaux';

function getLineFromFile(file) {
  const name = file.match(/^ligne-(\d+|[a-z]+)\.(json|md)$/)?.[1];
  if (name && /^\d+$/.test(name)) {
    return { line: Number(name), path: `/${config.slug}-${name}`, isSecondary: false };
  }
  const secondaryLine = config.secondaryLines.lines.find((line) => line.letter.toLowerCase() === name);
  if (!secondaryLine) {
    console.error(`Unknown line file: ${file}`);
    process.exit(1);
  }
  return { line: secondaryLine.line, path: `/${config.secondaryLines.slug}-${name}`, isSecondary: true };
}

(function checkDataHealth() {
  const links = getAllLinks();
  checkJsonFilesAreValid();
  checkGeoJsonDataHealth({ links });
  checkOtherNetworksDataHealth();
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

  fs.readdirSync(LINES_DIRECTORY).forEach((file) => {
    if (file.endsWith('.md')) {
      const pagePath = getLineFromFile(file).path;
      links.push(pagePath);

      const filePath = path.join(LINES_DIRECTORY, file);
      const markdownContent = fs.readFileSync(filePath, 'utf8');

      // extract html headings with id="..."
      const htmlTitleRegex = /<h[1-6]\s+id="([^"]+)"[^>]*>(.*?)<\/h[1-6]>/gm;
      let htmlMatch;
      while ((htmlMatch = htmlTitleRegex.exec(markdownContent)) !== null) {
        const link = htmlMatch[1];
        links.push(`${pagePath}#${link}`);
      }

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
        links.push(`${pagePath}#${link}`);
      }
    }
  });

  return links;
}

function checkLineString({ properties, filePath, requiredKeys, links }) {
  // 2 - check if all properties are present
  for (const key of requiredKeys) {
    if (!Object.hasOwn(properties, key)) {
      console.error(`Missing key '${key}' in LineString properties of file: ${filePath}`);
      process.exit(1);
    }
  }

  // 3.1 - check if status is valid
  const validStatus = ['done', 'wip', 'planned', 'priority-2030', 'tested', 'postponed', 'unknown'];
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
      console.error(`Missing key 'doneAt' in file: ${filePath}, tronçon: ${properties.name}`);
      process.exit(1);
    }

    // 4.2 - Check if all done section have a valid doneAt date
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(properties.doneAt)) {
      console.error(`Invalid doneAt format '${properties.doneAt}' in file: ${filePath}, tronçon: ${properties.name}`);
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

  if (links) {
    // 5 - check if link actually exists
    if (!properties.link) {
      console.error(`Missing link in LineString properties of file: ${filePath}`);
      process.exit(1);
    }
    if (!links.includes(properties.link)) {
      console.error(`Invalid link '${properties.link}' in LineString properties of file: ${filePath}`);
      process.exit(1);
    }
  }
}

function checkUniqueNames(lineStrings) {
  // 6 - Check if all properties.name x properties.line is unique
  const nameLineCount = lineStrings.reduce((count, { name, line }) => {
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

function checkGeoJsonDataHealth({ links }) {
  const allLineStrings = [];
  fs.readdirSync(LINES_DIRECTORY).forEach((file) => {
    if (file.endsWith('.json')) {
      const filePath = path.join(LINES_DIRECTORY, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const fileLine = getLineFromFile(file);
      const lineKeys = fileLine.isSecondary ? [] : ['line'];
      try {
        const geojson = JSON.parse(content);

        if (geojson.type === 'FeatureCollection') {
          for (const feature of geojson.features) {
            const properties = feature.properties || {};
            if (feature.geometry.type === 'LineString') {
              checkLineString({
                properties,
                filePath,
                requiredKeys: [...lineKeys, 'name', 'status', 'quality'],
                links,
              });
              allLineStrings.push({ id: properties.id, name: properties.name, line: fileLine.line });
            } else if (feature.geometry.type === 'Point') {
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
                const requiredKeys = ['type', ...lineKeys, 'name', 'imgUrl'];
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
    const id = lineString.id;
    count[id] = (count[id] || 0) + 1;
    return count;
  }, {});
  for (const id in idsCount) {
    if (idsCount[id] < 2) {
      console.error(`Missing LineString with id '${id}'`);
      process.exit(1);
    }
  }

  checkUniqueNames(allLineStrings);
}

function checkOtherNetworksDataHealth() {
  for (const network of config.otherNetworks) {
    const filePath = path.join(OTHER_NETWORKS_DIRECTORY, `${network.id}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`Missing file: ${filePath}`);
      process.exit(1);
    }
    const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const lineStrings = [];
    for (const feature of geojson.features) {
      if (feature.geometry.type !== 'LineString') {
        console.error(`Invalid geometry '${feature.geometry.type}' in file: ${filePath}`);
        process.exit(1);
      }
      const properties = feature.properties || {};
      checkLineString({ properties, filePath, requiredKeys: ['name', 'status', 'quality'] });
      lineStrings.push({ name: properties.name, line: network.line });
    }
    checkUniqueNames(lineStrings);
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
