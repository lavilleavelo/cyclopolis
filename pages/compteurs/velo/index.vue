<template>
  <CounterListLayout
    v-model:search-text="searchText"
    v-model:show-voies-lyonnaises="showVoiesLyonnaises"
    v-model:highlighted-counter="highlightedCounter"
    v-model:sort-by="sortBy"
    v-model:selected-month="selectedMonth"
    v-model:reference-year-offset="referenceYearOffset"
    v-model:display-mode="displayMode"
    v-model:show-map="showMap"
    v-model:selected-year="selectedYear"
    v-model:comparison-period="comparisonPeriod"
    :available-months="availableMonths"
    :available-years="availableYears"
    :counters="counters"
    :filtered-features="filteredFeatures"
    search-placeholder="Chercher un compteur, une ville, une VL..."
    empty-search-hint="Essayez un nom de rue (ex: Lafayette), une ville (ex: Villeurbanne) ou une voie lyonnaise (ex: VL 3)"
  >
    <template #header>
      <h2 class="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">
        Suivi des compteurs vélo de l'agglomération lyonnaise
      </h2>
      <p class="mt-4 text-xl text-gray-500 leading-8">
        Chaque début de mois, nous remontons les données de {{ stableCounters.length }} compteurs à vélo de
        l'agglomération lyonnaise.
      </p>
      <span class="text-sm text-gray-400"
        >Données&nbsp;:&nbsp;<a
          class="hover:underline"
          href="https://data.eco-counter.com/ParcPublic/?id=3902#"
          target="_blank"
          >data.eco-counter.com</a
        >
        et
        <a
          class="hover:underline"
          href="https://data.grandlyon.com/portail/fr/jeux-de-donnees/mesures-comptage-metropole-lyon/info"
          target="_blank"
          >data.grandlyon.com</a
        ></span
      >
    </template>
    <template #overview>
      <ChartMetropoleIndex
        v-if="stableCounters.length > 0"
        :counters="stableCounters"
        class="mb-6"
        @highlight="highlightedCounter = $event"
      />
    </template>
  </CounterListLayout>
</template>

<script setup lang="ts">
import type { ComparisonPeriod, DisplayMode, SortOption } from '~/components/counter/ListLayout.vue';
import type { CompteurFeature } from '~/types';
import { isTestSearch, matchesCounterSearch, useCounterSearch } from '~/composables/useCounterSearch';

const { getCompteursFeatures } = useMap();
const { getAvailableMonths, getAvailableYears, syncDefaultPeriod, sortCounters } = useCounterUtils();

const sortBy = ref<SortOption>('passages');
const displayMode = ref<DisplayMode>('monthly');
const comparisonPeriod = ref<ComparisonPeriod>('monthly');
const referenceYearOffset = ref<number>(1);
const showMap = ref<boolean>(true);
const selectedYear = ref<number>(0);

const { data: allCounters } = await useAsyncData('velo-counters', () => {
  return queryCollection('compteurs').where('path', 'LIKE', '/compteurs/velo%').all();
});

const stableCounters = computed(() => (allCounters.value ?? []).filter((counter) => !counter.test));
const visibleCounters = computed(() =>
  isTestSearch(searchText.value) ? (allCounters.value ?? []) : stableCounters.value,
);

const availableMonths = computed(() => getAvailableMonths(allCounters.value));
const availableYears = computed(() => getAvailableYears(availableMonths.value));

const selectedMonth = ref<string>('');
syncDefaultPeriod(selectedMonth, availableMonths, selectedYear, availableYears);

const counters = computed(() => {
  if (comparisonPeriod.value === 'monthly' && !selectedMonth.value) {
    return [];
  }

  if (comparisonPeriod.value === 'annual' && !selectedYear.value) {
    return [];
  }

  const sorted = sortCounters(
    visibleCounters.value,
    sortBy,
    comparisonPeriod,
    selectedMonth,
    selectedYear,
    referenceYearOffset,
  );

  return sorted
    .filter((counter) => matchesCounterSearch(counter, searchText.value))
    .map((counter) => ({
      ...counter,
      counts: counter.counts.map((count) => ({ month: count.month, veloCount: count.count })),
    }));
});

const counterFeatures = computed<CompteurFeature[]>(() => [
  ...getCompteursFeatures({
    counters: visibleCounters.value.filter((c) => !c.cyclopolisId),
    type: 'compteur-velo',
  }),
  ...getCompteursFeatures({
    counters: visibleCounters.value.filter((c) => c.cyclopolisId),
    type: 'compteur-velo',
    isMixed: true,
  }),
]);

const mapFeatures = computed(() => {
  if (!searchText.value) {
    return counterFeatures.value;
  }

  const names = new Set(counters.value.map((c) => c.name));
  return counterFeatures.value.filter((f) => names.has(f.properties.name));
});

const { searchText, showVoiesLyonnaises, highlightedCounter, filteredFeatures } = await useCounterSearch(mapFeatures, {
  sortBy,
  selectedMonth,
  selectedYear,
  referenceYearOffset,
  displayMode,
  comparisonPeriod,
  showMap,
});

const PAGE_TITLE = "Compteurs vélo de l'agglomération lyonnaise | Cyclopolis";
const DESCRIPTION =
  'Carte interactive et classement des compteurs vélo de la métropole de Lyon. ' +
  'Suivez la fréquentation cycliste mois par mois, comparez les années et explorez ' +
  "l'évolution du trafic.";

useHead({
  title: PAGE_TITLE,
  meta: [
    { hid: 'description', name: 'description', content: DESCRIPTION },
    { hid: 'og:title', property: 'og:title', content: PAGE_TITLE },
    { hid: 'og:description', property: 'og:description', content: DESCRIPTION },
    { hid: 'twitter:title', name: 'twitter:title', content: PAGE_TITLE },
    { hid: 'twitter:description', name: 'twitter:description', content: DESCRIPTION },
  ],
});
</script>
