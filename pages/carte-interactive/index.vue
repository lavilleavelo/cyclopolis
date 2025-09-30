<template>
  <div class="flex h-screen w-screen">
    <ClientOnly>
      <Map
        :features="filteredFeatures"
        :options="{ geolocation: true, canUseSidePanel: true, showLineFilters: true }"
        class="h-full flex-1"
        :total-distance="totalDistance"
        :filtered-distance="filteredDistance"
        @update="refreshFilters"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import { useBikeLaneFilters } from '~/composables/useBikeLaneFilters';

const { getRevName } = useConfig();

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen'
});

const { data: geojsons } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesGeojson').all();
});

const features: Ref<Collections['voiesCyclablesGeojson']['features']> = computed(() => {
  if (!geojsons.value) return [];
  return geojsons.value.flatMap(geojson => geojson.features);
});

const { refreshFilters, filteredFeatures, totalDistance, filteredDistance } = useBikeLaneFilters(features);

const description =
  `Découvrez la carte interactive des ${getRevName()}. Itinéraires rue par rue. Plan régulièrement mis à jour pour une information complète.`;
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
    { key: 'twitter:image', name: 'twitter:image', content: COVER_IMAGE_URL }
  ]
});
</script>
