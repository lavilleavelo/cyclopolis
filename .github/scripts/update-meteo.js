/**
 * Ce script permet de maj les données météo de la station de lyon bron
 * https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-quotidiennes/
 *
 * doc ici
 * https://object.files.data.gouv.fr/meteofrance/data/synchro_ftp/BASE/QUOT/Q_descriptif_champs_RR-T-Vent.csv
 * TN => température minimale (°C)
 * TX => température maximale (°C)
 * RR => précipitations (mm)
 *
 * required : NodeJS >= 18
 * run : node ./.github/scripts/update-meteo.js
 */

const fs = require('fs');
const path = require('path');

(async() => {
  const meteo = await getDailyMeteo();

  // Update lyon-bron.json counts property
  const jsonPath = path.join('content', 'compteurs', 'climat', 'lyon-bron.json');
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const lastSavedWeatherReport = json.counts[json.counts.length - 1];

  const lastSavedWeatherReportIndex = meteo.findIndex(m => m.AAAAMMJJ === lastSavedWeatherReport.AAAAMMJJ);
  if (lastSavedWeatherReportIndex === -1) {
    console.error('[update-meteo] Last saved weather report not found in fetched data. Aborting to avoid duplicates.');
    process.exit(1);
  }
  const newWeatherReports = meteo.slice(lastSavedWeatherReportIndex + 1);
  if (newWeatherReports.length === 0) {
    console.log('[update-meteo] No new weather reports to add.');
    return;
  }

  json.counts.push(...newWeatherReports);
  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf-8');
})();

async function getDailyMeteo() {
  let meteo = [];

  const PAGE = 3; // début au 2025-02-04
  let url = `https://tabular-api.data.gouv.fr/api/resources/e2243f62-f5d4-4485-81c1-931e61f7505f/data/?NOM_USUEL__exact=LYON-BRON&columns=NOM_USUEL,AAAAMMJJ,TN,TX,RR&page=${PAGE}&page_size=200`;
  while (url) {
    const res = await fetch(url);
    if (res.ok) {
      const { data, links } = await res.json();
      meteo = [...meteo, ...data];
      url = links.next;
    } else {
      console.error('[getDailyMeteo] An error happened while fetching meteo');
      process.exit(1);
    }
  }

  return meteo;
}

