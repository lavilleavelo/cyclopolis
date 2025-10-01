import fs from 'fs/promises';
import osmtogeojson from "osmtogeojson";

const queries = [
    {
        name: 'voies-lyonnaises',
        query: 'nwr["cycle_network" = "Les Voies Lyonnaises"](45.543388795387315,4.5476522032490605,46.04702502686093,5.210951763795935);'
    },
]

async function downloadOverpassData(overpassQuery) {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({data: `[out:json][timeout:25];\n` + overpassQuery + `out geom;`})
    });

    if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText} (${await response.text().catch(() => 'no body')})`);
    }

    return await response.json()
}

async function saveDataToFile(data, filename) {
    if (!await fs.stat('./content/osm').catch(() => false)) {
        throw new Error('Directory ./content/osm does not exist. Please run the script from the project root directory.');
    }

    let pathToFile = `./content/osm/${filename}.json`;
    await fs.writeFile(pathToFile, JSON.stringify(osmtogeojson(data), null, 2));
    console.log(`Data saved to ${pathToFile}`);
}

async function saveQuery(query) {
    const data = await downloadOverpassData(query.query);
    await saveDataToFile(data, query.name);
}

(async () => {
    try {
        for (const query of queries) {
            await saveQuery(query);
        }
    } catch (error) {
        console.error('Error:', error);
    }
})();
