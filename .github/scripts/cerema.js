/**
 * Le cerema est l'organisme qui remonte les données des compteurs voiture, à Lyon et ailleurs.
 * Il faut probablement voir ça comme l'équivalent de éco-compteur, pour les voitures.
 * Interface web : https://avatar.cerema.fr/cartographie
 * API : https://avatar.cerema.fr/api/doc
 *
 * À priori, ça semble jouable de récupérer les données des compteurs.
 * Il faut utiliser le endpoint /fixed_measures, sur lequel ils passent une couche de ML pour éviter le bruit
 * qui existe de par la nature physique des compteurs (trou dans les données, ou à l'inverse pic).
 *
 * À noter que ce endpoint retourne un point toutes les 6min. Il faut donc pas mal boucler pour récupérer
 * les données mensuelles qu'on exploite sur cyclopolis.
 *
 * Script toujours en WIP
 */
const fs = require('fs');
const path = require('path');

(async () => {
  const trackedCounters = getTrackedCounters();
  for (const { file, counter } of trackedCounters) {
    console.log(`<<<<<<< ${counter.name} >>>>>>>`);
    const counts = await getCompteurData({ idPdc: counter.idPdc });
    updateFile({ file, counter: { ...counter, counts } });
  }
})();

function getTrackedCounters() {
  const files = fs.readdirSync('content/compteurs/voiture');
  return files.map((file) => {
    const filePath = path.join('content/compteurs/voiture', file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      file,
      counter: data,
    };
  });
}

/**
 * récupération des données d'un compteur
 */
async function getCompteurData({ idPdc }) {
  const months = getAllMonths();

  const counts = [];

  for (const month of months) {
    const params = new URLSearchParams({
      count_point_ids: idPdc,
      as_vehicle_nb: true,
      start_time: month.start_time,
      end_time: month.end_time,
      time_zone: 'Europe/Paris',
      limit: 10000, // un point toutes les 6 minutes
    });
    const URL = 'https://avatar.cerema.fr/api/fixed_measures/?' + params.toString();
    const res = await fetch(URL, {
      headers: { 'X-Fields': 'id,count_point_name,station_name,op_road_name' },
    });
    if (res.ok) {
      const data = await res.json();
      const count = data.reduce((acc, item) => acc + item.q, 0);
      console.log({ month: getFirstDayOfMonth(month.start_time), count });
      counts.push({ month: getFirstDayOfMonth(month.start_time), count });
      await new Promise((resolve) => setTimeout(resolve, 60000));
    } else {
      console.log(res.statusText);
      console.error('[getCompteurData] An error happened while fetching counter data');
      process.exit(1);
    }
  }

  return counts;
}

function getAllMonths() {
  const startDate = new Date('2018-01-01');
  const endDate = new Date('2024-03-01');

  const result = [];

  let currentDate = new Date(startDate);
  while (currentDate < endDate) {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    result.push({
      start_time: convertDate(startOfMonth.toISOString()),
      end_time: convertDate(endOfMonth.toISOString()),
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return result;
}

// no timezone
function convertDate(isoString) {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // Adding 1 because months are zero-based
  const day = ('0' + date.getDate()).slice(-2);
  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const seconds = ('0' + date.getSeconds()).slice(-2);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function getFirstDayOfMonth(start_time) {
  const startDate = new Date(start_time);
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1; // Note: getMonth() returns 0-based index
  const formattedMonth = month < 10 ? '0' + month : month; // Ensure double digits for month

  return `${year}/${formattedMonth}/01`;
}

function updateFile({ file, counter }) {
  const filePath = path.join('content/compteurs/voiture', file);
  fs.writeFileSync(filePath, JSON.stringify(counter, null, 2));
}
