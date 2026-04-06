<template>
  <ContentFrame
    v-if="counter"
    header="compteur vélo"
    :title="counter.name"
    :sub-title="counter.arrondissement"
    :description="counter.description"
    :image-url="counter.imageUrl"
  >
    <ClientOnly fallback-tag="div">
      <template #fallback>
        <MapPlaceholder style="height: 40vh" additional-class="mt-6" />
      </template>
      <Map
        :features="features"
        :options="{ roundedCorners: true, legend: false, filter: false }"
        class="mt-6"
        style="height: 40vh"
      />
    </ClientOnly>

    <CounterMaintenanceBanner :counts="counter.counts" />

    <div v-if="(counter?.lines?.length || 0) > 0" class="mt-2 text-center justify-center">
      Ce compteur est installé sur
      <span>la </span>
      <span v-for="(line, index) in counter.lines" :key="line">
        <LineLink :line="String(line)" anchor="overview" />
        <span v-if="index < counter.lines.length - 2">, la </span>
        <span v-else-if="index === counter.lines.length - 2"> et la </span>
      </span>
    </div>

    <div v-if="matchingVoitureCounter" class="mt-4 flex flex-wrap justify-center gap-3">
      <NuxtLink
        :to="matchingVoitureCounter.path"
        class="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-lvv-blue-600 font-medium text-sm no-underline"
      >
        <Icon name="fluent:vehicle-car-profile-ltr-16-regular" class="text-lg" />
        Voir le compteur voiture
      </NuxtLink>
      <NuxtLink
        :to="`/compteurs/comparaison/${counter.cyclopolisId}`"
        class="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors text-lvv-pink font-medium text-sm no-underline"
      >
        <Icon name="fluent:vehicle-bicycle-16-regular" class="text-lg" />
        Comparaison vélo / voiture
      </NuxtLink>
    </div>

    <h2>Total des passages par année</h2>
    <p>Ce premier diagramme représente le nombre total de passages détecté par le compteur vélo chaque année.</p>
    <ChartTotalByYear :title="graphTitles.totalByYear" :data="counter" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" />

    <h2>Comparaison des passages</h2>
    <p>
      Comparez la fréquentation cyclable pour un mois donné à travers les années, ou visualisez l'évolution mois par
      mois sur plusieurs années.
    </p>
    <ChartMonthComparison
      :title="graphTitles.monthComparison"
      :data="counter"
      class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
    />

    <template v-if="counter.limitation">
      <h2>Limitation</h2>
      <p>{{ counter.limitation }}</p>
    </template>

    <h2>Source des données</h2>
    <p>
      Les données proviennent de
      <a href="https://data.eco-counter.com/ParcPublic/?id=3902#" target="_blank">data.eco-counter.com</a>.
    </p>
  </ContentFrame>
</template>

<script setup>
import MapPlaceholder from '~/components/MapPlaceholder.vue';

const { path } = useRoute();
const { withoutTrailingSlash } = useUrl();
const { getCompteursFeatures } = useMap();

const { data: counter } = await useAsyncData(path, () => {
  return queryCollection('compteurs').path(withoutTrailingSlash(path)).first();
});

if (!counter.value) {
  const router = useRouter();
  router.push({ path: '/404' });
}

const { data: matchingVoitureCounter } = await useAsyncData(`voiture-match-${path}`, () => {
  if (!counter.value?.cyclopolisId) return Promise.resolve(null);
  return queryCollection('compteurs')
    .where('path', 'LIKE', '/compteurs/voiture%')
    .where('cyclopolisId', '=', counter.value.cyclopolisId)
    .first();
});

const graphTitles = {
  totalByYear: `Fréquentation cycliste annuelle - ${counter.value.name}`,
  monthComparison: `Fréquentation cycliste - ${counter.value.name}`,
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
    { hid: 'twitter:image', name: 'twitter:image', content: IMAGE_URL },
  ],
});
</script>
