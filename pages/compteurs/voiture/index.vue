<template>
  <CounterListLayout
    v-model:search-text="searchText"
    v-model:show-voies-lyonnaises="showVoiesLyonnaises"
    v-model:highlighted-counter="highlightedCounter"
    v-model:sort-by="sortBy"
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
import type { SortOption } from '~/components/counter/ListLayout.vue';
import { removeDiacritics } from '~/helpers/helpers';
import { useCounterSearch } from '~/composables/useCounterSearch';

const { getCompteursFeatures } = useMap();
const { getLatestEvolution } = useCounterMaintenance();

const sortBy = ref<SortOption>('passages');

const { data: allCounters } = await useAsyncData(() => {
  return queryCollection('compteurs').where('path', 'LIKE', '/compteurs/voiture%').all();
});

const counters = computed(() => {
  if (!allCounters.value) return [];
  return [...allCounters.value]
    .sort((a, b) => {
      if (sortBy.value === 'evolution') {
        return (getLatestEvolution(b.counts) ?? -Infinity) - (getLatestEvolution(a.counts) ?? -Infinity);
      }
      return (b.counts.at(-1)?.count ?? 0) - (a.counts.at(-1)?.count ?? 0);
    })
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
  if (!searchText.value) return counterFeatures;
  const names = new Set(counters.value.map((c) => c.name));
  return counterFeatures.filter((f) => names.has(f.properties.name));
});

const { searchText, showVoiesLyonnaises, highlightedCounter, filteredFeatures } = await useCounterSearch(mapFeatures);
</script>
