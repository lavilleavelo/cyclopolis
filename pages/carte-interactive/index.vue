<template>
  <div class="flex h-screen w-screen">
    <ClientOnly fallback-tag="div">
      <template #fallback>
        <MapPlaceholder />
      </template>

      <Map
        :features="filteredFeatures"
        :options="{
          geolocation: true,
          updateUrlOnFeatureClick: true,
          canUseSidePanel: true,
          showLineFilters: true,
          showDetailsPanel: true,
          showDateFilter: true,
          showGeocoder: true,
          showCounters: displayCounters(),
        }"
        class="h-full flex-1"
        :total-distance="totalDistance"
        :filtered-distance="filteredDistance"
        :geojsons="geojsons"
        :filters="filters"
        :actions="actions"
        :voies="voies"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { CompteurFeature } from '~/types';
import { useBikeLaneFilters } from '~/composables/useBikeLaneFilters';
import MapPlaceholder from '~/components/MapPlaceholder.vue';
import { useVoiesCyclablesGeojson, useGetVoiesCyclablesNums } from '~/composables/useVoiesCyclables';

const { getRevName, displayCounters } = useConfig();
const { getCompteursFeatures } = useMap();

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen',
});

const { geojsons } = await useVoiesCyclablesGeojson();
const { voies } = await useGetVoiesCyclablesNums();

const { data: veloCounters } = await useAsyncData(
  'map-velo-counters',
  () => {
    if (!displayCounters()) return Promise.resolve(null);
    return queryCollection('compteurs').where('path', 'LIKE', '/compteurs/velo%').all();
  },
  { deep: false },
);

const { data: voitureCounters } = await useAsyncData(
  'map-voiture-counters',
  () => {
    if (!displayCounters()) return Promise.resolve(null);
    return queryCollection('compteurs').where('path', 'LIKE', '/compteurs/voiture%').all();
  },
  { deep: false },
);

const counterFeatures = computed<CompteurFeature[]>(() => {
  const voitureCyclopolisIds = new Set(
    (voitureCounters.value || []).filter((c) => c.cyclopolisId).map((c) => c.cyclopolisId),
  );

  const veloOnly = (veloCounters.value || []).filter((c) => !c.cyclopolisId);
  const veloMixed = (veloCounters.value || []).filter((c) => c.cyclopolisId);
  const voitureOnly = (voitureCounters.value || []).filter((c) => !c.cyclopolisId);

  const veloOnlyFeatures = getCompteursFeatures({ counters: veloOnly, type: 'compteur-velo' });
  const voitureOnlyFeatures = getCompteursFeatures({ counters: voitureOnly, type: 'compteur-voiture' });

  const mixedFeatures: CompteurFeature[] = veloMixed.map((counter) => {
    const hasVoiture = voitureCyclopolisIds.has(counter.cyclopolisId);
    const voiture = hasVoiture
      ? (voitureCounters.value || []).find((c) => c.cyclopolisId === counter.cyclopolisId)
      : null;

    const counts = voiture
      ? voiture.counts.map((vc) => {
          const veloCount = counter.counts.find((v) => v.month === vc.month);
          return { month: vc.month, veloCount: veloCount?.count || 0, voitureCount: vc.count };
        })
      : counter.counts;

    return {
      type: 'Feature',
      properties: {
        type: hasVoiture ? ('compteur-comparaison' as const) : ('compteur-velo' as const),
        isMixed: hasVoiture,
        name: counter.name,
        link: hasVoiture ? `/compteurs/comparaison/${counter.cyclopolisId}` : counter.path,
        counts,
      },
      geometry: {
        type: 'Point',
        coordinates: [counter.coordinates[0], counter.coordinates[1]] as [number, number],
      },
    };
  });

  return [...veloOnlyFeatures, ...voitureOnlyFeatures, ...mixedFeatures];
});

const features = computed(() => {
  const laneFeatures = geojsons.value ? geojsons.value.flatMap((geojson) => geojson.features) : [];
  return [...laneFeatures, ...counterFeatures.value];
});

const { filters, actions, filteredFeatures, totalDistance, filteredDistance } = useBikeLaneFilters({
  allFeatures: features,
  allGeojsons: computed(() => geojsons.value),
  allLines: computed(() => voies.value),
});

const description = `Découvrez la carte interactive des ${getRevName()}. Itinéraires rue par rue. Plan régulièrement mis à jour pour une information complète.`;
const COVER_IMAGE_URL = 'https://cyclopolis.lavilleavelo.org/cyclopolis.png';
const CANONICAL_URL = 'https://cyclopolis.fr/carte-interactive';

useHead({
  title: `Carte à jour des ${getRevName()}`,
  link: [{ rel: 'canonical', href: CANONICAL_URL }],
  meta: [
    // description
    { key: 'description', name: 'description', content: description },
    { key: 'og:description', property: 'og:description', content: description },
    { key: 'twitter:description', name: 'twitter:description', content: description },
    // cover image
    { key: 'og:image', property: 'og:image', content: COVER_IMAGE_URL },
    { key: 'twitter:image', name: 'twitter:image', content: COVER_IMAGE_URL },
  ],
});
</script>
