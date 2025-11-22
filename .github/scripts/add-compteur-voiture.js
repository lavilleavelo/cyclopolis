/**
 * Ce script permet d'ajouter un compteur voiture.
 * Les compteurs existants sont dans content/compteurs/voiture.
 *
 * Comment ça marche ?
 * Les compteurs ont un id unique. La liste de tous les ids est dispo
 * dans le fichier cerema.json.
 * Bien vérifier ce que mesure ce compteur, en allant le retrouver sur google street view.
 * Une fois que c'est bon, écraser l'ID ci-dessous avec l'ID du compteur que l'on souhaite ajouter.
 * Puis faire tourner le script.
 * Enfin, aller ajuster les données dans le json généré (description, arrondissement)
 *
 * required : NodeJS >= 18
 * run : node ./.github/scripts/add-compteur-voiture.js
 */
const fs = require('fs');
const path = require('path');

const ID = 1550;

(async () => {
  const counter = await getCompteur({ idPdc: ID });
  const counts = await getCompteurCounts({ idPdc: ID });
  createFile({ counter: { ...counter, counts } });
})();

async function getCompteur({ idPdc }) {
  const URL = `https://avatar.cerema.fr/api/countpoint/${idPdc}`;
  const res = await fetch(URL);
  if (res.ok) {
    const data = await res.json();
    return {
      name: data.station_name.replace(/_/g, ' '),
      description: '',
      arrondissement: 'Lyon xxx',
      idPdc,
      coordinates: getCompteurCoordinates({ position: data.punctual_position }),
    };
  } else {
    console.log(res.statusText);
    console.error('[getCompteur] An error happened while fetching counter');
    process.exit(1);
  }
}

/**
 * input : 'POINT (4.84509228773754 45.75456769141947)'
 * output: [4.84509228773754, 45.75456769141947]
 */
function getCompteurCoordinates({ position }) {
  return position
    .replace('POINT (', '')
    .replace(')', '')
    .split(' ')
    .map((coordinateString) => parseFloat(coordinateString));
}

async function getCompteurCounts({ idPdc }) {
  const startTime = '2018-01-01T00:00:00';
  const endTime = getLastDayOfPreviousMonth();
  const params = new URLSearchParams({
    count_point_ids: idPdc,
    start_time: startTime,
    end_time: endTime,
    time_zone: 'Europe/Paris',
    aggregation_period: 'month',
    limit: 1000, // default 10
  });
  const URL = 'https://avatar.cerema.fr/api/aggregated_measures/?' + params.toString();
  const res = await fetch(URL);
  if (res.ok) {
    const countPoints = await res.json();
    return countPoints.map((countPoint) => {
      const daysInMonth = getDaysInMonth(countPoint.dt);
      return {
        month: countPoint.dt.slice(0, 10),
        count: Math.round(countPoint.q * daysInMonth),
      };
    });
  } else {
    console.log(res.statusText);
    console.error('[getCompteurData] An error happened while fetching counter data');
    process.exit(1);
  }
}

function getLastDayOfPreviousMonth() {
  const lastDayOfPreviousMonth = new Date().setDate(0);
  return `${new Date(lastDayOfPreviousMonth).toISOString().slice(0, 10)}T23:59:59`;
}

function getDaysInMonth(date) {
  const [year, month] = date.split('-');
  return new Date(year, month, 0).getDate();
}

function createFile({ counter }) {
  const file = `${counter.name.toLowerCase().split(' ').join('-')}.json`;
  const filePath = path.join('content/compteurs/voiture', file);
  fs.writeFileSync(filePath, JSON.stringify(counter, null, 2));
}
