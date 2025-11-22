/**
 * Ce script permet de maj les données des compteurs voiture suivis
 * https://avatar.cerema.fr/api/doc
 *
 * required : NodeJS >= 18
 * run : node ./.github/scripts/update-voiture-counters.js
 */
const fs = require('fs');
const path = require('path');

(async () => {
  const trackedCounters = getTrackedCounters();
  for (const { file, counter } of trackedCounters) {
    console.log(`<<<<<<< ${counter.name} >>>>>>>`);
    const counts = await getCompteurData({ idsPdc: counter.idsPdc });
    updateFile({ file, counter: { ...counter, counts } });
  }
})();

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));

/**
 * Suite aux échanges avec le Cerema, utilisation de l'API aggregated_measures.
 * Elle retourne le volume moyen quotidien sur le mois concené.
 * Pour avoir le volume total mensuel, on multiplie par le nbr de jours dans le mois.
 *
 * Cyclopolis raisonne en axe, pas en compteur.
 * Un compteur au sens cyclopolis peut donc regrouper plusieurs compteurs au sens Cerema.
 * Typiquement, un compteur cyclopolis est un aggrégat de 2 compteurs Cerema, un pour chaque sens de circulation.
 */
async function getCompteurData({ idsPdc }) {
  const startTime = '2018-01-01T00:00:00';
  const endTime = getLastDayOfPreviousMonth();

  const resByIdPdc = {};

  for (const idPdc of idsPdc) {
    const params = new URLSearchParams({
      count_point_ids: idPdc,
      start_time: startTime,
      end_time: endTime,
      time_zone: 'Europe/Paris',
      aggregation_period: 'month',
      limit: 1000 // default 10
    });
    const URL = 'https://avatar.cerema.fr/api/aggregated_measures/?' + params.toString();
    const res = await fetch(URL);
    if (res.ok) {
      const countPoints = await res.json();

      resByIdPdc[idPdc] = countPoints.map(countPoint => {
        const daysInMonth = getDaysInMonth(countPoint.dt);
        return {
          month: countPoint.dt.slice(0, 10),
          count: Math.round(countPoint.q * daysInMonth)
        };
      });
    } else {
      console.log(res.statusText);
      console.error('[getCompteurData] An error happened while fetching counter data');
      process.exit(1);
    }
    // petite pause pour ne pas se faire jeter avec un "TOO MANY REQUESTS"
    await sleep(15000);
  }

  if (idsPdc.length === 1) return resByIdPdc[idsPdc[0]];

  return mergeCountersData(resByIdPdc);
}

/**
 * input looks like this
 * {
 *   '1927': [
 *     { month: '2018-01-01', count: 591573 },
 *     { month: '2018-02-01', count: 538166 },
 *     { month: '2018-03-01', count: 604185 },
 *     // other data
 *   ],
 *   '1928': [
 *     { month: '2018-01-01', count: 646861 },
 *     { month: '2018-02-01', count: 581317 },
 *     { month: '2018-03-01', count: 682203 },
 *     // other data
 *   ]
 * }
 *
 * output should look like
 * [
 *   { month: '2018-01-01', count: 1238434 },
 *   { month: '2018-02-01', count: 1119483 },
 *   // other data
 * ]
 */
function mergeCountersData(input) {
  const data = new Map();

  // Iterate through each key in the input object
  Object.values(input).forEach(dataArray => {
    dataArray.forEach(item => {
      const { month, count } = item;
      if (data.has(month)) {
        // If the month already exists, add the count
        data.set(month, data.get(month) + count);
      } else {
        // If it's a new month, set the count
        data.set(month, count);
      }
    });
  });

  // Convert the Map to an array of objects
  return Array.from(data, ([month, count]) => ({ month, count }));
}

/**
 * Github action runs every 1st day of each month.
 * So it should fetch data until last day of previous month as we only look at monthly data.
 */
function getLastDayOfPreviousMonth() {
  const lastDayOfPreviousMonth = new Date().setDate(0);
  return `${new Date(lastDayOfPreviousMonth).toISOString().slice(0, 10)}T23:59:59`;
}

/**
 * isostring en input
 * ex: 2024-01-01T00:00:00+01:00 => 31
 */
function getDaysInMonth(date) {
  const [year, month] = date.split('-');
  return new Date(year, month, 0).getDate();
}

function getTrackedCounters() {
  const files = fs.readdirSync('content/compteurs/voiture');
  return files.map(file => {
    const filePath = path.join('content/compteurs/voiture', file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      file,
      counter: data
    };
  });
}

function updateFile({ file, counter }) {
  const filePath = path.join('content/compteurs/voiture', file);
  fs.writeFileSync(filePath, JSON.stringify(counter, null, 2));
}
