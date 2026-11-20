/**
 * Ce script permet de maj les données des compteurs vélo suivis
 * https://data.eco-counter.com/ParcPublic/?id=3902#
 *
 * required : NodeJS >= 18
 * run : node ./.github/scripts/update-velo-counters.js
 */
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
dayjs().format();

const CONCURRENCY = 8;
const MAX_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 60_000;
const GRAND_LYON_CHANNELS_URL =
  'https://data.grandlyon.com/fr/datapusher/ws/rdata/pvo_patrimoine_voirie.pvocomptagechannel/all.json';
const GRAND_LYON_MEASURES_URL =
  'https://data.grandlyon.com/fr/datapusher/ws/timeseries/pvo_patrimoine_voirie.pvocomptagemeasure/all.json';
const GRAND_LYON_MOBILITY_TYPES = ['BIKE', 'E-SCOOTER'];

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

(async () => {
  const startedAt = Date.now();
  const allCounters = await getAllCounters();
  const trackedCounters = getTrackedCounters();
  const failures = [];

  for (let i = 0; i < trackedCounters.length; i += CONCURRENCY) {
    const batch = trackedCounters.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((tracked) => updateCounter({ tracked, allCounters, failures })));
  }

  const untrackedCounters = allCounters.filter(
    (counter) => !trackedCounters.some((tracked) => tracked.counter.idPdc === counter.idPdc),
  );
  if (untrackedCounters.length > 0) {
    console.log(`\n${untrackedCounters.length} counters not tracked yet:`);
    for (const counter of untrackedCounters) {
      console.log(counter.name);
    }
  }

  console.log(`\n${trackedCounters.length} counters processed in ${Math.round((Date.now() - startedAt) / 1000)}s`);

  if (failures.length > 0) {
    console.error(`\n${failures.length} counter(s) could not be updated:`);
    for (const { name, error } of failures) {
      console.error(`- ${name}: ${error.message}`);
    }
    process.exit(1);
  }
})();

async function updateCounter({ tracked, allCounters, failures }) {
  const { file, counter: trackCounter } = tracked;
  const isGrandLyon = trackCounter.source === 'grand-lyon';
  const counter = allCounters.find((c) => c.idPdc === trackCounter.idPdc);
  if (!isGrandLyon && !counter) {
    console.error(`<<<<<<< ${trackCounter.name} >>>>>>> counter not found`, { trackCounter });
    return;
  }

  try {
    const updatedCounts = isGrandLyon
      ? await getGrandLyonCounts(trackCounter.idPdc)
      : await getUpdatedCounts({ idPdc: trackCounter.idPdc, flowIds: counter.flowIds });
    updateFile({ file, counter: { ...trackCounter, counts: updatedCounts } });
    console.log(`<<<<<<< ${trackCounter.name} >>>>>>>`);
  } catch (error) {
    console.error(`<<<<<<< ${trackCounter.name} >>>>>>> FAILED: ${error.message}`);
    failures.push({ name: trackCounter.name, error });
  }
}

async function getAllCounters() {
  const URL = 'https://www.eco-visio.net/api/aladdin/1.0.0/pbl/publicwebpageplus/3902?withNull=true&pratiques=2,13';
  const res = await fetch(URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (res.ok) {
    const allCounters = await res.json();
    return allCounters.map((counter) => ({
      name: counter.nom,
      idPdc: counter.idPdc,
      flowIds: counter.pratique.map((item) => item.id).join(';'),
    }));
  } else {
    console.error('[getAllCounters] An error happened while fetching counters');
    process.exit(1);
  }
}

function getTrackedCounters() {
  const files = fs.readdirSync('content/compteurs/velo');
  return files.map((file) => {
    const filePath = path.join('content/compteurs/velo', file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      file,
      counter: data,
    };
  });
}

async function getUpdatedCounts({ idPdc, flowIds }) {
  const URL =
    `https://www.eco-visio.net/api/aladdin/1.0.0/pbl/publicwebpageplus/data/${idPdc}?` +
    new URLSearchParams({
      idOrganisme: '3902',
      idPdc,
      flowIds,
      debut: '01/01/2015',
      fin: dayjs().startOf('month').format('DD/MM/YYYY'),
      interval: '6', // month
    });

  const counts = await fetchJson(URL);
  return counts.map((count) => {
    const date = new Date(count[0]);
    const year = date.toLocaleDateString('fr-FR', { year: 'numeric' });
    const month = date.toLocaleDateString('fr-FR', { month: '2-digit' });
    return {
      month: `${year}-${month}-01`,
      count: Number(count[1]),
    };
  });
}

async function getGrandLyonCounts(siteId) {
  const { values: channels } = await fetchJson(
    `${GRAND_LYON_CHANNELS_URL}?` +
      new URLSearchParams({ maxfeatures: '-1', start: '1', field: 'site_id', value: String(siteId) }),
  );
  const bikeChannels = channels.filter((channel) => GRAND_LYON_MOBILITY_TYPES.includes(channel.mobility_type));
  if (bikeChannels.length === 0) {
    throw new Error(`no bike channel for site ${siteId} on data.grandlyon.com`);
  }

  const firstYear = Math.min(...bikeChannels.map((channel) => Number((channel.started_at ?? '2015').slice(0, 4))));
  const end = dayjs().startOf('month');
  const countsByMonth = new Map();
  for (let year = firstYear; year <= end.year(); year++) {
    const { values } = await fetchJson(
      `${GRAND_LYON_MEASURES_URL}?` +
        new URLSearchParams({
          maxfeatures: '-1',
          start: '1',
          channel_id__in: bikeChannels.map((channel) => channel.channel_id).join(','),
          start_datetime__gte: `${year}-01-01`,
          start_datetime__lt: year === end.year() ? end.format('YYYY-MM-DD') : `${year + 1}-01-01`,
        }),
    );
    for (const { start_datetime: startDatetime, count } of values) {
      const month = `${startDatetime.slice(0, 7)}-01`;
      countsByMonth.set(month, (countsByMonth.get(month) ?? 0) + (count ?? 0));
    }
  }

  return [...countsByMonth].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
}

async function fetchJson(url) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }

      const delay = attempt * 5000;
      console.warn(
        `[fetchJson] ${url} attempt ${attempt}/${MAX_ATTEMPTS} failed (${error.message}), retrying in ${delay / 1000}s`,
      );
      await sleep(delay);
    }
  }
}

function updateFile({ file, counter }) {
  const filePath = path.join('content/compteurs/velo', file);
  fs.writeFileSync(filePath, JSON.stringify(counter, null, 2));
}
