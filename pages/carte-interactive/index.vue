<template>
  <div class="flex h-screen w-screen">
    <ClientOnly fallback-tag="div">
      <template #fallback>
        <MapPlaceholder />
      </template>

      <Map
        :features="filteredFeatures"
        :options="{ geolocation: true, canUseSidePanel: true, showLineFilters: true, showDateFilter: true }"
        class="h-full flex-1"
        :total-distance="totalDistance"
        :filtered-distance="filteredDistance"
        :geojsons="geojsons"
        :filters="filters"
        :actions="actions"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import { useBikeLaneFilters } from '~/composables/useBikeLaneFilters';
import MapPlaceholder from '~/components/MapPlaceholder.vue';
import { useVoiesCyclablesGeojson, useGetVoiesCyclablesNums } from '~/composables/useVoiesCyclables';

const { getRevName } = useConfig();

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen',
});

const { geojsons } = await useVoiesCyclablesGeojson();
const { voies } = await useGetVoiesCyclablesNums();

const features: Ref<Collections['voiesCyclablesGeojson']['features']> = computed(() => {
  if (!geojsons.value) return [];
  return geojsons.value.flatMap((geojson) => geojson.features);
});

const { filters, actions, filteredFeatures, totalDistance, filteredDistance } = useBikeLaneFilters({
  allFeatures: features,
  allGeojsons: computed(() => geojsons.value),
  allLines: computed(() => voies.value),
});

const description = `Découvrez la carte interactive des ${getRevName()}. Itinéraires rue par rue. Plan régulièrement mis à jour pour une information complète.`;
const COVER_IMAGE_URL = 'https://cyclopolis.lavilleavelo.org/cyclopolis.png';
useHead({
  title: `Carte à jour des ${getRevName()}`,
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
