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

  if (allCounters.length !== trackedCounters.length) {
    console.log(`\n${allCounters.length - trackedCounters.length} counters not tracked yet:`);
    for (const counter of allCounters) {
      if (!trackedCounters.find((c) => c.counter.idPdc === counter.idPdc)) {
        console.log(counter.name);
      }
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
  const counter = allCounters.find((c) => c.idPdc === trackCounter.idPdc);
  if (!counter) {
    console.error(`<<<<<<< ${trackCounter.name} >>>>>>> counter not found`, { trackCounter });
    return;
  }

  try {
    const updatedCounts = await getUpdatedCounts({ idPdc: trackCounter.idPdc, flowIds: counter.flowIds });
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

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const counts = await res.json();
      return counts.map((count) => {
        const date = new Date(count[0]);
        const year = date.toLocaleDateString('fr-FR', { year: 'numeric' });
        const month = date.toLocaleDateString('fr-FR', { month: '2-digit' });
        return {
          month: `${year}-${month}-01`,
          count: Number(count[1]),
        };
      });
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }

      const delay = attempt * 5000;
      console.warn(
        `[getUpdatedCounts] idPdc=${idPdc} attempt ${attempt}/${MAX_ATTEMPTS} failed (${error.message}), retrying in ${delay / 1000}s`,
      );
      await sleep(delay);
    }
  }
}

function updateFile({ file, counter }) {
  const filePath = path.join('content/compteurs/velo', file);
  fs.writeFileSync(filePath, JSON.stringify(counter, null, 2));
}
