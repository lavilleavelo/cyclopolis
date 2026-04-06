<template>
  <CounterListLayout
    v-model:search-text="searchText"
    v-model:show-voies-lyonnaises="showVoiesLyonnaises"
    v-model:highlighted-counter="highlightedCounter"
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
        Chaque début de mois, nous remontons les données de {{ allCounters?.length ?? 0 }} compteurs à vélo de
        l'agglomération lyonnaise.
      </p>
      <span class="text-sm text-gray-400"
        >Données&nbsp;:&nbsp;<a
          class="hover:underline"
          href="https://data.eco-counter.com/ParcPublic/?id=3902#"
          target="_blank"
          >data.eco-counter.com</a
        ></span
      >
    </template>
  </CounterListLayout>
</template>

<script setup lang="ts">
import type { CompteurFeature } from '~/types';
import { matchesCounterSearch, useCounterSearch } from '~/composables/useCounterSearch';

const { getCompteursFeatures } = useMap();

const { data: allCounters } = await useAsyncData('velo-counters', () => {
  return queryCollection('compteurs').where('path', 'LIKE', '/compteurs/velo%').all();
});

const counters = computed(() => {
  if (!allCounters.value) {
    return [];
  }

  return [...allCounters.value]
    .sort((a, b) => (b.counts.at(-1)?.count ?? 0) - (a.counts.at(-1)?.count ?? 0))
    .filter((counter) => matchesCounterSearch(counter, searchText.value))
    .map((counter) => ({
      ...counter,
      counts: counter.counts.map((count) => ({ month: count.month, veloCount: count.count })),
    }));
});

const veloOnly = (allCounters.value || []).filter((c) => !c.cyclopolisId);
const mixed = (allCounters.value || []).filter((c) => c.cyclopolisId);
const counterFeatures: CompteurFeature[] = [
  ...getCompteursFeatures({ counters: veloOnly, type: 'compteur-velo' }),
  ...getCompteursFeatures({ counters: mixed, type: 'compteur-velo', isMixed: true }),
];

const mapFeatures = computed(() => {
  if (!searchText.value) {
    return counterFeatures;
  }

  const names = new Set(counters.value.map((c) => c.name));
  return counterFeatures.filter((f) => names.has(f.properties.name));
});

const { searchText, showVoiesLyonnaises, highlightedCounter, filteredFeatures } = await useCounterSearch(mapFeatures);
</script>
