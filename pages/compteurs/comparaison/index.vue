<template>
  <CounterListLayout
    v-model:search-text="searchText"
    v-model:show-voies-lyonnaises="showVoiesLyonnaises"
    v-model:highlighted-counter="highlightedCounter"
    v-model:sort-by="sortBy"
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
  </CounterListLayout>
</template>

<script setup lang="ts">
import type { SortOption } from '~/components/counter/ListLayout.vue';
import { matchesCounterSearch, useCounterSearch } from '~/composables/useCounterSearch';

const { getLatestEvolution } = useCounterMaintenance();

const sortBy = ref<SortOption>('passages');

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

const counters = computed(() => {
  if (!allVeloCounters.value) return [];

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
    .filter((counter): counter is NonNullable<typeof counter> => !!counter)
    .filter((counter) => matchesCounterSearch(counter, searchText.value))
    .sort((a, b) => {
      if (sortBy.value === 'evolution') {
        const veloAccessor = (c: { veloCount: number }) => c.veloCount;
        return (
          (getLatestEvolution(b.counts, veloAccessor) ?? -Infinity) -
          (getLatestEvolution(a.counts, veloAccessor) ?? -Infinity)
        );
      }
      const lastA = a.counts.at(-1);
      const lastB = b.counts.at(-1);
      if (!lastA || !lastB) return 0;
      const monthDiff = new Date(lastB.month).getTime() - new Date(lastA.month).getTime();
      if (monthDiff !== 0) return monthDiff;
      return (lastB.veloCount || 0) - (lastA.veloCount || 0);
    });
});

const { getCompteursFeatures } = useMap();

const mapFeatures = computed(() =>
  getCompteursFeatures({
    counters: counters.value as unknown as Parameters<typeof getCompteursFeatures>[0]['counters'],
    type: 'compteur-comparaison',
    isMixed: true,
  }),
);

const { searchText, showVoiesLyonnaises, highlightedCounter, filteredFeatures } = await useCounterSearch(mapFeatures);
</script>
