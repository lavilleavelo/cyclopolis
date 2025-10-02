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

(async() => {
  const allCounters = await getAllCounters();
  const trackedCounters = getTrackedCounters();
  for (const { file, counter: trackCounter } of trackedCounters) {
    console.log(`<<<<<<< ${trackCounter.name} >>>>>>>`);
    const counter = allCounters.find(c => c.idPdc === trackCounter.idPdc);
    if (!counter) {
      console.error('counter not found', { trackCounter });
      continue;
    }
    const { flowIds } = counter;
    const updatedCounts = await getUpdatedCounts({ idPdc: trackCounter.idPdc, flowIds });
    updateFile({ file, counter: { ...trackCounter, counts: updatedCounts } });
  }

  if (allCounters.length !== trackedCounters.length) {
    console.log(`\n${allCounters.length - trackedCounters.length} counters not tracked yet:`);
    for (const counter of allCounters) {
      if (!trackedCounters.find(c => c.counter.idPdc === counter.idPdc)) {
        console.log(counter.name);
      }
    }
  }
})();

async function getAllCounters() {
  /**
   * The `pratiques` query parameter is a comma separated list of the following optional integers:
   * - 1 marche
   * - 2 vélo
   * - 13 trottinette
   */
  const URL = 'https://www.eco-visio.net/api/aladdin/1.0.0/pbl/publicwebpageplus/3902?withNull=true&pratiques=2,13';
  const res = await fetch(URL);
  if (res.ok) {
    const allCounters = await res.json();
    return allCounters.map(counter => ({
      name: counter.nom,
      idPdc: counter.idPdc,
      flowIds: counter.pratique.map(item => item.id).join(';')
    }));
  } else {
    console.error('[getAllCounters] An error happened while fetching counters');
    process.exit(1);
  }
}
function getTrackedCounters() {
  const files = fs.readdirSync('content/compteurs/velo');
  return files.map(file => {
    const filePath = path.join('content/compteurs/velo', file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      file,
      counter: data
    };
  });
}

async function getUpdatedCounts({ idPdc, flowIds }) {
  const URL = `https://www.eco-visio.net/api/aladdin/1.0.0/pbl/publicwebpageplus/data/${idPdc}?`;
  const res = await fetch(
    URL +
    new URLSearchParams({
      idOrganisme: '3902',
      idPdc,
      flowIds,
      debut: '01/01/2015',
      fin: dayjs().startOf('month').format('DD/MM/YYYY'),
      interval: '6' // month
    })
  );
  if (res.ok) {
    const counts = await res.json();
    return counts.map(count => {
      const date = new Date(count[0]);
      const year = date.toLocaleDateString('fr-FR', { year: 'numeric' });
      const month = date.toLocaleDateString('fr-FR', { month: '2-digit' });
      return {
        month: `${year}-${month}-01`,
        count: Number(count[1])
      };
    });
  } else {
    console.error('[getUpdatedCounts] An error happened while fetching counts', res);
    process.exit(1);
  }
}

function updateFile({ file, counter }) {
  const filePath = path.join('content/compteurs/velo', file);
  fs.writeFileSync(filePath, JSON.stringify(counter, null, 2));
}
