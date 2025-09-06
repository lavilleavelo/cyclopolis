<template>
  <ContentFrame
    v-if="counter"
    header="compteur voiture"
    :title="counter.name"
    :sub-title="counter.arrondissement"
    :description="counter.description"
    :image-url="counter.imageUrl"
  >
    <ClientOnly>
      <Map :features="features" :options="{ legend: false, filter: false }" class="mt-12" style="height: 40vh" />
    </ClientOnly>
    <h2>Total des passages par année</h2>
    <p>Ce premier diagramme représente le nombre total de passages détecté par le compteur voiture chaque année.</p>
    <ChartTotalByYear :title="graphTitles.totalByYear" :data="counter" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" />

    <h2>Comparaison des passages pour un mois donné</h2>
    <p>Choisissez un mois dans le menu déroulant ci-dessous pour visualiser l'évolution de la fréquentation voiture pour le même mois de chaque année.</p>
    <ChartMonthComparison :title="graphTitles.monthComparison" :data="counter" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" />

    <template v-if="counter.limitation">
      <h2>Limitation</h2>
      <p>{{ counter.limitation }}</p>
    </template>

    <h2>Source des données</h2>
    <p>Les données proviennent du <a href="https://avatar.cerema.fr/cartographie" target="_blank">Cerema</a>.</p>
  </ContentFrame>
</template>

<script setup>
const { path } = useRoute();
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
  totalByYear: `Fréquentation voiture annuelle - ${counter.value.name}`,
  monthComparison: `Fréquentation voiture - ${counter.value.name}`
};

const features = getCompteursFeatures({ counters: [counter.value], type: 'compteur-voiture' });

const DESCRIPTION = `Compteur voiture ${counter.value.name}`;
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
</script>
