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
    search-placeholder="Chercher un compteur, une ville..."
    empty-search-hint="Essayez un nom de rue (ex: Lafayette) ou une ville (ex: Villeurbanne)"
  >
    <template #header>
      <h2 class="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">
        Suivi des compteurs voiture de l'agglomération lyonnaise
      </h2>
      <p class="mt-2">
        <span class="text-sm text-gray-400"
          >Données&nbsp;:&nbsp;<a class="hover:underline" href="https://avatar.cerema.fr/cartographie" target="_blank"
            >avatar.cerema.fr</a
          ></span
        >
      </p>
    </template>
    <template #overview>
      <ChartMetropoleIndex
        v-if="allCounters && allCounters.length > 0"
        :counters="allCounters"
        kind="voiture"
        class="mb-6"
        @highlight="highlightedCounter = $event"
      />
    </template>
  </CounterListLayout>
</template>

<script setup lang="ts">
import type { ComparisonPeriod, DisplayMode, SortOption } from '~/components/counter/ListLayout.vue';
import { removeDiacritics } from '~/helpers/helpers';
import { useCounterSearch } from '~/composables/useCounterSearch';

const { getCompteursFeatures } = useMap();
const { getAvailableMonths, getAvailableYears, syncDefaultPeriod, sortCounters } = useCounterUtils();

const sortBy = ref<SortOption>('passages');
const displayMode = ref<DisplayMode>('monthly');
const comparisonPeriod = ref<ComparisonPeriod>('monthly');
const referenceYearOffset = ref<number>(1);
const showMap = ref<boolean>(true);
const selectedYear = ref<number>(0);

const { data: allCounters } = await useAsyncData(() => {
  return queryCollection('compteurs').where('path', 'LIKE', '/compteurs/voiture%').all();
});

const availableMonths = computed(() => getAvailableMonths(allCounters.value));
const availableYears = computed(() => getAvailableYears(availableMonths.value));

const selectedMonth = ref<string>('');
syncDefaultPeriod(selectedMonth, availableMonths, selectedYear, availableYears);

const counters = computed(() => {
  if (!allCounters.value) {
    return [];
  }

  if (comparisonPeriod.value === 'monthly' && !selectedMonth.value) {
    return [];
  }

  if (comparisonPeriod.value === 'annual' && !selectedYear.value) {
    return [];
  }

  const sorted = sortCounters(
    allCounters.value,
    sortBy,
    comparisonPeriod,
    selectedMonth,
    selectedYear,
    referenceYearOffset,
  );

  return sorted
    .filter((counter) =>
      searchText.value
        ? removeDiacritics(`${counter.arrondissement} ${counter.name}`).includes(removeDiacritics(searchText.value))
        : true,
    )
    .map((counter) => ({
      ...counter,
      counts: counter.counts.map((count) => ({ month: count.month, voitureCount: count.count })),
    }));
});

const voitureOnly = (allCounters.value || []).filter((c) => !c.cyclopolisId);
const mixed = (allCounters.value || []).filter((c) => c.cyclopolisId);
const counterFeatures = [
  ...getCompteursFeatures({ counters: voitureOnly, type: 'compteur-voiture' }),
  ...getCompteursFeatures({ counters: mixed, type: 'compteur-voiture', isMixed: true }),
];

const mapFeatures = computed(() => {
  if (!searchText.value) {
    return counterFeatures;
  }

  const names = new Set(counters.value.map((c) => c.name));
  return counterFeatures.filter((f) => names.has(f.properties.name));
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

const PAGE_TITLE = "Compteurs voiture de l'agglomération lyonnaise | Cyclopolis";
const DESCRIPTION =
  'Carte interactive et classement des compteurs voiture de la métropole de Lyon. ' +
  "Suivez la fréquentation automobile mois par mois et comparez l'évolution du trafic.";

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
