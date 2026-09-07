/**
 * Ce script permet de maj les données des compteurs voiture suivis
 * https://avatar.cerema.fr/api/doc
 *
 * required : NodeJS >= 18
 * run : node ./.github/scripts/update-voiture-counters.js
 */
const fs = require('fs');
const path = require('path');

/**
 * L'API Cerema est limitée à environ 5 requêtes par minute
 * Mais elle accepte plusieurs points de comptage par requête (count_point_ids séparés par des virgules) et renvoie jusqu'à 10 000 lignes.
 * On regroupe donc les ids par paquets
 */
const IDS_PER_REQUEST = 20;
const MAX_ROWS_PER_REQUEST = 10_000;
const MAX_ATTEMPTS = 4;
const RETRY_AFTER_429_MS = 65_000;
const FETCH_TIMEOUT_MS = 60_000;

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

(async () => {
  const startedAt = Date.now();
  const trackedCounters = getTrackedCounters();
  const idsPdc = [...new Set(trackedCounters.flatMap(({ counter }) => counter.idsPdc))];
  console.log(`${trackedCounters.length} counters, ${idsPdc.length} Cerema count points`);

  const countsByIdPdc = await getCountsByIdPdc({ idsPdc });

  for (const { file, counter } of trackedCounters) {
    console.log(`<<<<<<< ${counter.name} >>>>>>>`);
    const counts = getCompteurData({ idsPdc: counter.idsPdc, countsByIdPdc });
    updateFile({ file, counter: { ...counter, counts } });
  }

  console.log(`\n${trackedCounters.length} counters processed in ${Math.round((Date.now() - startedAt) / 1000)}s`);
})();

/**
 * Récupère les mesures mensuelles de tous les points de comptage, par paquets de IDS_PER_REQUEST.
 * [idPdc]: [{ month, count }, ...] }.
 */
async function getCountsByIdPdc({ idsPdc }) {
  const startTime = '2018-01-01T00:00:00';
  const endTime = getLastDayOfPreviousMonth();
  const countsByIdPdc = {};
  for (const idPdc of idsPdc) {
    countsByIdPdc[idPdc] = [];
  }

  for (let i = 0; i < idsPdc.length; i += IDS_PER_REQUEST) {
    const batch = idsPdc.slice(i, i + IDS_PER_REQUEST);
    const rows = await fetchAggregatedMeasures({ idsPdc: batch, startTime, endTime });
    console.log(`fetched ${rows.length} rows for ${batch.length} count points`);

    for (const row of rows) {
      const daysInMonth = getDaysInMonth(row.dt);
      countsByIdPdc[row.count_point_id].push({
        month: row.dt.slice(0, 10),
        count: Math.round(row.q * daysInMonth),
      });
    }
  }

  const missing = idsPdc.filter((idPdc) => countsByIdPdc[idPdc].length === 0);
  if (missing.length > 0) {
    console.warn(`[getCountsByIdPdc] no data returned for count points: ${missing.join(', ')}`);
  }

  return countsByIdPdc;
}

async function fetchAggregatedMeasures({ idsPdc, startTime, endTime }) {
  const params = new URLSearchParams({
    count_point_ids: idsPdc.join(','),
    start_time: startTime,
    end_time: endTime,
    time_zone: 'Europe/Paris',
    aggregation_period: 'month',
    limit: MAX_ROWS_PER_REQUEST,
  });
  const URL = 'https://avatar.cerema.fr/api/aggregated_measures/?' + params.toString();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (res.status === 429) {
        throw new RateLimitError(await res.text());
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const rows = await res.json();
      if (rows.length >= MAX_ROWS_PER_REQUEST) {
        console.error(
          `[fetchAggregatedMeasures] ${rows.length} rows returned: the API cap is reached, lower IDS_PER_REQUEST`,
        );
        process.exit(1);
      }
      return rows;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        console.error('[fetchAggregatedMeasures] An error happened while fetching counter data', error.message);
        process.exit(1);
      }
      const delay = error instanceof RateLimitError ? RETRY_AFTER_429_MS : attempt * 5000;
      console.warn(
        `[fetchAggregatedMeasures] attempt ${attempt}/${MAX_ATTEMPTS} failed (${error.message}), retrying in ${delay / 1000}s`,
      );
      await sleep(delay);
    }
  }
}

class RateLimitError extends Error {
  constructor(body) {
    super(`HTTP 429 Too Many Requests ${body}`.trim());
  }
}

/**
 * Suite aux échanges avec le Cerema, utilisation de l'API aggregated_measures.
 * Elle retourne le volume moyen quotidien sur le mois concené.
 * Pour avoir le volume total mensuel, on multiplie par le nbr de jours dans le mois.
 *
 * Cyclopolis raisonne en axe, pas en compteur.
 * Un compteur au sens cyclopolis peut donc regrouper plusieurs compteurs au sens Cerema.
 * Typiquement, un compteur cyclopolis est un aggrégat de 2 compteurs Cerema, un pour chaque sens de circulation.
 */
function getCompteurData({ idsPdc, countsByIdPdc }) {
  if (idsPdc.length === 1) {
    return countsByIdPdc[idsPdc[0]];
  }

  const resByIdPdc = {};
  for (const idPdc of idsPdc) {
    resByIdPdc[idPdc] = countsByIdPdc[idPdc];
  }
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
  Object.values(input).forEach((dataArray) => {
    dataArray.forEach((item) => {
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
  return files.map((file) => {
    const filePath = path.join('content/compteurs/voiture', file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      file,
      counter: data,
    };
  });
}

function updateFile({ file, counter }) {
  const filePath = path.join('content/compteurs/voiture', file);
  fs.writeFileSync(filePath, JSON.stringify(counter, null, 2));
}
