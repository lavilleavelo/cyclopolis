<template>
  <ContentFrame
    v-if="counter"
    header="compteur vélo"
    :title="counter.name"
    :sub-title="counter.arrondissement"
    :description="counter.description"
    :image-url="counter.imageUrl"
  >
    <ClientOnly>
      <Map :features="features" :options="{ legend: false, filter: false }" class="mt-12" style="height: 40vh" />
    </ClientOnly>
    <h2>Total des passages par année</h2>
    <p>Ce premier diagramme représente le nombre total de passages détecté par le compteur vélo chaque année.</p>
    <ChartTotalByYear :title="graphTitles.totalByYear" :data="counter" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" />

    <h2>Comparaison des passages pour un mois donné</h2>
    <p>Choisissez un mois dans le menu déroulant ci-dessous pour visualiser l'évolution de la fréquentation cyclable pour le même mois de chaque année.</p>
    <p>Le meilleur mois jamais enregistré pour ce compteur est <strong>{{ bestMonthEver.month }} {{ bestMonthEver.year }}</strong> avec <strong>{{ bestMonthEver.value }}</strong> passages.</p>
    <ChartMonthComparison :title="graphTitles.monthComparison" :data="counter" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" />

    <template v-if="counter.limitation">
      <h2>Limitation</h2>
      <p>{{ counter.limitation }}</p>
    </template>

    <!-- <template v-if="counter && counter.lines && counter.lines.length > 0">
      <h2>{{ getRevName() }} mesurées par ce compteur</h2>
      <ul>
        <li v-for="line in counter.lines" :key="line">
          <LineLink :line="String(line)" />
        </li>
      </ul>
    </template> -->

    <h2>Source des données</h2>
    <p>Les données proviennent de <a href="https://data.eco-counter.com/ParcPublic/?id=3902#" target="_blank">data.eco-counter.com</a>.</p>
  </ContentFrame>
</template>

<script setup>
const { path } = useRoute();
// const { getRevName } = useConfig();
const { withoutTrailingSlash } = useUrl();
const { getCompteursFeatures } = useMap();

const { data: counter } = await useAsyncData(path, () => {
  return queryCollection('compteurs')
    .path(withoutTrailingSlash(path))
    .first();
});

if (!counter.value) {
  const router = useRouter();
  router.push({ path: '/404' });
}

const graphTitles = {
  totalByYear: `Fréquentation cycliste annuelle - ${counter.value.name}`,
  monthComparison: `Fréquentation cycliste - ${counter.value.name}`
};

const features = getCompteursFeatures({ counters: [counter.value], type: 'compteur-velo' });

const DESCRIPTION = `Compteur vélo ${counter.value.name}`;
const IMAGE_URL = counter.value.imageUrl;
useHead({
  meta: [
    // description
    { hid: 'description', name: 'description', content: DESCRIPTION },
    { hid: 'og:description', property: 'og:description', DESCRIPTION },
    { hid: 'twitter:description', name: 'twitter:description', DESCRIPTION },
    // cover image
    { hid: 'og:image', property: 'og:image', content: IMAGE_URL },
    { hid: 'twitter:image', name: 'twitter:image', content: IMAGE_URL }
  ]
});

let bestMonthEver = counter.value.counts.reduce((best, measure) => {
  if (!best) return measure
  return measure.count > best.count ? measure : best
})
bestMonthEver = {
  month: new Date(bestMonthEver.month).toLocaleString('fr-Fr', { month: 'long' }),
  year: new Date(bestMonthEver.month).toLocaleString('fr-Fr', { year: 'numeric' }),
  value: bestMonthEver.count.toLocaleString('fr-FR'),
}
</script>
