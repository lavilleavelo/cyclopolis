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
        Comparaison de la fréquentation cycliste et automobile.
      </h2>
      <p class="mt-4 text-xl text-gray-500 leading-8">
        Cette page permet de comparer l'évolution des fréquentations cyclistes et automobiles sur un même axe.
      </p>
      <span class="text-sm text-gray-400"
        >Données&nbsp;:&nbsp;<a class="hover:underline" href="https://avatar.cerema.fr/cartographie" target="_blank"
          >avatar.cerema.fr</a
        >,
        <a class="hover:underline" href="https://data.eco-counter.com/ParcPublic/?id=3902#" target="_blank"
          >data.eco-counter.com</a
        ></span
      >
    </template>
    <template #overview>
      <ChartMetropoleIndexCompare
        v-if="allVeloFull && allVoitureFull && allVeloFull.length > 0 && allVoitureFull.length > 0"
        :velo-counters="allVeloFull"
        :voiture-counters="allVoitureFull"
        class="mb-6"
      />
    </template>
  </CounterListLayout>
</template>

<script setup lang="ts">
import type { ComparisonPeriod, DisplayMode, SortOption } from '~/components/counter/ListLayout.vue';
import { matchesCounterSearch, useCounterSearch } from '~/composables/useCounterSearch';

const { getAvailableMonths, getAvailableYears, syncDefaultPeriod, sortCounters } = useCounterUtils();

const sortBy = ref<SortOption>('passages');
const displayMode = ref<DisplayMode>('monthly');
const comparisonPeriod = ref<ComparisonPeriod>('monthly');
const referenceYearOffset = ref<number>(1);
const selectedMonth = ref<string>('');
const selectedYear = ref<number>(0);
const showMap = ref<boolean>(true);

/**
 * la clé cyclopolisId sert à faire le lien entre les compteurs vélo et voiture
 * cette page compare les 2 sur un même axe, on ne s'intéresse donc qu'à ceux qui ont
 * un cyclopolisId
 */
const { data: allVeloCounters } = await useAsyncData(() => {
  return queryCollection('compteurs')
    .where('path', 'LIKE', '/compteurs/velo%')
    .where('cyclopolisId', 'IS NOT NULL')
    .all();
});

const { data: allVoitureCounters } = await useAsyncData(() => {
  return queryCollection('compteurs')
    .where('path', 'LIKE', '/compteurs/voiture%')
    .where('cyclopolisId', 'IS NOT NULL')
    .all();
});

const { data: allVeloFull } = await useAsyncData('comparaison-velo-full', () => {
  return queryCollection('compteurs').where('path', 'LIKE', '/compteurs/velo%').all();
});

const { data: allVoitureFull } = await useAsyncData('comparaison-voiture-full', () => {
  return queryCollection('compteurs').where('path', 'LIKE', '/compteurs/voiture%').all();
});

const mergedCounters = computed(() => {
  if (!allVeloCounters.value) {
    return [];
  }

  return allVeloCounters.value
    .map((veloCounter) => {
      if (!veloCounter.cyclopolisId || !allVoitureCounters.value) return undefined;
      const voitureCounter = allVoitureCounters.value.find((vc) => vc.cyclopolisId === veloCounter.cyclopolisId);
      if (!voitureCounter) return undefined;
      return {
        ...veloCounter,
        path: `/compteurs/comparaison/${veloCounter.cyclopolisId}`,
        counts: voitureCounter.counts.map((voitureCount) => {
          const veloCount = veloCounter.counts.find((vc) => vc.month === voitureCount.month);
          return {
            month: voitureCount.month,
            veloCount: veloCount?.count || 0,
            voitureCount: voitureCount.count,
          };
        }),
      };
    })
    .filter((counter): counter is NonNullable<typeof counter> => !!counter);
});

const availableMonths = computed(() => getAvailableMonths(mergedCounters.value, (c) => c.veloCount + c.voitureCount));
const availableYears = computed(() => getAvailableYears(availableMonths.value));

syncDefaultPeriod(selectedMonth, availableMonths, selectedYear, availableYears);

const counters = computed(() => {
  if (comparisonPeriod.value === 'monthly' && !selectedMonth.value) {
    return [];
  }

  if (comparisonPeriod.value === 'annual' && !selectedYear.value) {
    return [];
  }

  const veloAccessor = (c: { veloCount: number }) => c.veloCount;

  const sorted = sortCounters(
    mergedCounters.value,
    sortBy,
    comparisonPeriod,
    selectedMonth,
    selectedYear,
    referenceYearOffset,
    veloAccessor,
  );

  return sorted.filter((counter) => matchesCounterSearch(counter, searchText.value));
});

const { getCompteursFeatures } = useMap();

const mapFeatures = computed(() =>
  getCompteursFeatures({
    counters: counters.value as unknown as Parameters<typeof getCompteursFeatures>[0]['counters'],
    type: 'compteur-comparaison',
    isMixed: true,
  }),
);

const { searchText, showVoiesLyonnaises, highlightedCounter, filteredFeatures } = await useCounterSearch(mapFeatures, {
  sortBy,
  selectedMonth,
  selectedYear,
  referenceYearOffset,
  displayMode,
  comparisonPeriod,
  showMap,
});
</script>
