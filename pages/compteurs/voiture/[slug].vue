<template>
  <ContentFrame
    v-if="counter"
    header="compteur voiture"
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
        :options="{ roundedCorners: true, legend: false, filter: false, cooperativeGestures: true }"
        class="mt-6"
        style="height: 40vh"
      />
    </ClientOnly>

    <CounterMaintenanceBanner :counts="counter.counts" />

    <CounterLinks :velo="matchingVeloCounter?.path" :comparison="comparisonPath" class="mt-4" />
    <CounterStatsSummary v-if="counterStats" :stats="counterStats" />

    <ProseH2 id="total-des-passages-par-annee">Total des passages par année</ProseH2>
    <p>Ce premier diagramme représente le nombre total de passages détecté par le compteur voiture chaque année.</p>
    <ChartTotalByYear
      :title="graphTitles.totalByYear"
      :data="counter"
      sync-url
      class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
    />

    <ProseH2 id="historique-mensuel">Historique mensuel</ProseH2>
    <p>Nombre de passages détecté chaque mois depuis la mise en service du compteur.</p>
    <ChartMonthlyHistogram
      :title="graphTitles.monthlyHistogram"
      :data="counter"
      :color="'#7B1F3D'"
      class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
    />

    <ProseH2 id="comparaison-des-passages">Comparaison des passages</ProseH2>
    <p>
      Comparez la fréquentation voiture pour un mois donné à travers les années, ou visualisez l'évolution mois par mois
      sur plusieurs années.
    </p>
    <ChartMonthComparison
      sync-url
      :title="graphTitles.monthComparison"
      :data="counter"
      class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
    />

    <CounterDetailedStats :counter="{ type: 'voiture', idsPdc: counter.idsPdc }" :name="counter.name" />

    <template v-if="counter.limitation">
      <ProseH2 id="limitation">Limitation</ProseH2>
      <p>{{ counter.limitation }}</p>
    </template>

    <ProseH2 id="source-des-donnees">Source des données</ProseH2>
    <p>
      Les données proviennent de <a href="https://avatar.cerema.fr/cartographie" target="_blank">avatar.cerema.fr</a>.
    </p>
    <a href="https://avatar.cerema.fr/cartographie" target="_blank">
      <img src="https://cyclopolis.lavilleavelo.org/avatar_cerema.png" alt="Logo Cerema" class="h-12" />
    </a>

    <CounterLinks :velo="matchingVeloCounter?.path" :comparison="comparisonPath" class="mt-10" />
  </ContentFrame>
</template>

<script setup>
import MapPlaceholder from '~/components/MapPlaceholder.vue';
import { useChartDisplayMode } from '~/composables/useChartDisplayMode';
import { buildCounterStats } from '~/composables/useCounterStats';
import { useQueryParam, valuesQueryParam } from '~/composables/useQueryParam';

const { path } = useRoute();
useQueryParam('vue', useChartDisplayMode(), valuesQueryParam({ total: 'total', jour: 'daily' }));
const { withoutTrailingSlash } = useUrl();
const { getCompteursFeatures } = useMap();

const { data: counter } = await useAsyncData(path, () => {
  return queryCollection('compteurs').path(withoutTrailingSlash(path)).first();
});

if (!counter.value) {
  const router = useRouter();
  router.push({ path: '/404' });
}

const { data: matchingVeloCounter } = await useAsyncData(`velo-match-${path}`, () => {
  if (!counter.value?.cyclopolisId) return Promise.resolve(null);
  return queryCollection('compteurs')
    .where('path', 'LIKE', '/compteurs/velo%')
    .where('cyclopolisId', '=', counter.value.cyclopolisId)
    .first();
});

const comparisonPath = computed(() =>
  matchingVeloCounter.value ? `/compteurs/comparaison/${counter.value.cyclopolisId}` : undefined,
);

const graphTitles = {
  totalByYear: `Fréquentation voiture annuelle - ${counter.value.name}`,
  monthlyHistogram: `Fréquentation voiture mensuelle - ${counter.value.name}`,
  monthComparison: `Fréquentation voiture - ${counter.value.name}`,
};

const features = getCompteursFeatures({ counters: [counter.value], type: 'compteur-voiture' });

const counterStats = computed(() => buildCounterStats(counter.value?.counts ?? [], 'voitures'));

const PAGE_TITLE = `Compteur voiture ${counter.value.name}${counter.value.arrondissement ? ` (${counter.value.arrondissement})` : ''} | Cyclopolis`;
const DESCRIPTION = `Compteur voiture ${counter.value.name}${counter.value.arrondissement ? ` à ${counter.value.arrondissement}` : ''}. ${counterStats.value.summarySentence} Suivez l'évolution du trafic automobile mois par mois et année par année.`;
const IMAGE_URL = counter.value.imageUrl;
useHead({
  title: PAGE_TITLE,
  meta: [
    { hid: 'description', name: 'description', content: DESCRIPTION },
    { hid: 'og:title', property: 'og:title', content: PAGE_TITLE },
    { hid: 'og:description', property: 'og:description', content: DESCRIPTION },
    { hid: 'og:type', property: 'og:type', content: 'article' },
    { hid: 'og:image', property: 'og:image', content: IMAGE_URL },
    { hid: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
    { hid: 'twitter:title', name: 'twitter:title', content: PAGE_TITLE },
    { hid: 'twitter:description', name: 'twitter:description', content: DESCRIPTION },
    { hid: 'twitter:image', name: 'twitter:image', content: IMAGE_URL },
  ],
});
</script>
