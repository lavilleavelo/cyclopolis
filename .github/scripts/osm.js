/**
 * Ce script permet de maj les données OSM de la carto des services vélo.
 * Il va chercher les données sur overpass turbo.
 * https://overpass-turbo.eu/?Q=%2F%2F+%40name+Lyon+bike+parking%0A%0A%5Bout%3Ajson%5D%3B%0A%7B%7BgeocodeArea%3ALyon%7D%7D-%3E.searchArea%3B%0A%28%0A++node%5B%22amenity%22%3D%22bicycle_parking%22%5D%28area.searchArea%29%3B%0A++way%5B%22amenity%22%3D%22bicycle_parking%22%5D%28area.searchArea%29%3B%0A++relation%5B%22amenity%22%3D%22bicycle_parking%22%5D%28area.searchArea%29%3B%0A%29%3B%0Aout+body%3B%0A%2F%2Fout+ids+geom%3B%0A%3E%3B%0Aout+skel+qt%3B&C=45.751145%3B4.847374%3B14
 *
 * required : NodeJS >= 18
 * run : node ./.github/scripts/osm.js
 */
const fs = require('fs');
const path = require('path');

(async () => {
  const pumps = await getPumps();
  const filePath = path.join('content/services/pumps.json');
  fs.writeFileSync(filePath, JSON.stringify(pumps, null, 2));
})();

async function getPumps() {
  const URL =
    'https://overpass-api.de/api/interpreter?data=[out:json];area["name"="Métropole de Lyon"]->.searchArea;(node["service:bicycle:pump"="yes"](area.searchArea);way["service:bicycle:pump"="yes"](area.searchArea););out;';
  const res = await fetch(URL);
  if (res.ok) {
    const data = await res.json();
    return formatPumps(data);
  } else {
    console.error(res.error);
    process.exit(1);
  }
}

function formatPumps(data) {
  return {
    type: 'FeatureCollection',
    features: data.elements
      .filter(item => item.lon && item.lat)
      .map(item => {
        return {
          type: 'Feature',
          properties: {
            type: 'pump',
            id: item.id,
            name: item.tags.name
          },
          geometry: {
            type: 'Point',
            coordinates: [item.lon, item.lat]
          }
        };
      })
  };
}
