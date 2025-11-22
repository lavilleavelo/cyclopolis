/**
 * Plus un test qu'autre chose ...
 * J'essaye de récupérer les données des compteurs voiture depuis le portail open data du grand lyon.
 * Les données du cerema ont l'air plus fiables et plus faciles à exploiter.
 */

(async () => {
  // const compteurs = await getAllCarCompteurs();
  // console.log(JSON.stringify(compteurs, null, 2));
  const data = await getOneCarCompteurData();
  console.log(JSON.stringify(data, null, 2));
})();

/**
 * info
 * https://data.grandlyon.com/portail/fr/jeux-de-donnees/channels-sites-comptage-metropole-lyon/info
 */
/*async function getAllCarCompteurs() {
  const URL =
    'https://data.grandlyon.com/fr/datapusher/ws/rdata/pvo_patrimoine_voirie.pvocomptagechannel/all.json?maxfeatures=-1&start=1';
  const res = await fetch(URL);
  if (res.ok) {
    const data = await res.json();
    return data.values
      .filter(({ mobility_type }) => mobility_type === 'CAR')
      .map((item) => ({
        channel_id: item.channel_id,
        site_id: item.site_id,
        comment: item.comment,
        data_provider_name: item.data_provider_name,
        temporality: item.temporality,
      }));
  } else {
    console.error('[getAllCounters] An error happened while fetching counters');
    process.exit(1);
  }
}*/

/**
 * info
 * https://data.grandlyon.com/portail/fr/jeux-de-donnees/mesures-comptage-metropole-lyon/info
 */
async function getOneCarCompteurData() {
  const URL =
    'https://download.data.grandlyon.com/ws/timeseries/pvo_patrimoine_voirie.pvocomptagemeasure/all.json?start_datetime__gte=2024-01-01&start_datetime__lt=2024-01-02&channel_id__eq=106062853';
  const res = await fetch(URL);
  if (res.ok) {
    const data = await res.json();
    return data.values
      .map((item) => ({
        channel_id: item.channel_id,
        count: item.count,
        start_datetime: item.start_datetime,
        end_datetime: item.end_datetime,
      }))
      .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
  } else {
    console.error('[getAllCounters] An error happened while fetching counters');
    process.exit(1);
  }
}
