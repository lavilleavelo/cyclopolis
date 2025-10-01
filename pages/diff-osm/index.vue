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

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen'
});

const { data: geojsons } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesGeojson').all();
});

const { data: osmGeojsons } = await useAsyncData(() => {
  return queryCollection('osmVoiesLyonnaises').first();
});


const features: Ref<Collections['voiesCyclablesGeojson']['features']> = computed(() => {
  if (!geojsons.value) return [];
  return geojsons.value.flatMap(geojson => geojson.features).concat(osmGeojsons.value ? osmGeojsons.value.features : []);
});

const { refreshFilters, filteredFeatures, totalDistance, filteredDistance } = useBikeLaneFilters(features);

</script>
