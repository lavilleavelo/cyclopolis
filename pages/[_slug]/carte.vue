<template>
  <div class="h-full w-full relative">
    <ClientOnly fallback-tag="div">
      <template #fallback>
        <MapPlaceholder style="height: 100%; width: 100%" />
      </template>
      <Map
        :features="filteredFeatures"
        :options="mapOptions"
        class="h-full w-full"
        :total-distance="totalDistance"
        :filtered-distance="filteredDistance"
        :filters="filters"
        :actions="actions"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import { useBikeLaneFilters } from '~/composables/useBikeLaneFilters';
import MapPlaceholder from "~/components/MapPlaceholder.vue";

const { path } = useRoute();
const { getVoieCyclableRegex } = useUrl();
const { getRevName } = useConfig();

const regex = getVoieCyclableRegex();
const match = path.match(regex);
const line = match ? match[1] : '';

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen',
  middleware: 'voie-cyclable'
});

const mapOptions = {
  shrink: true,
  canUseSidePanel: true,
  onShrinkControlClick: () => {
    const route = useRoute();
    return navigateTo({ path: `/${route.params._slug}` });
  }
};

const { data: geojson } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesGeojson')
    .path(`/voies-cyclables/ligne-${line}`)
    .first();
});

const features: Ref<Collections['voiesCyclablesGeojson']['features']> = computed(() => {
  if (!geojson.value) return [];
  return geojson.value.features;
});

const { filters, actions, filteredFeatures, totalDistance, filteredDistance } = useBikeLaneFilters({ allFeatures: features });

const description = `Carte de la ${getRevName('singular')} ${line}. Découvrez les tronçons prévus, déjà réalisés, en travaux et ceux reportés après 2026.`;
useHead({
  title: `Carte de la ${getRevName('singular')} ${line}`,
  meta: [
    // description
    { key: 'description', name: 'description', content: description },
    { key: 'og:description', property: 'og:description', content: description },
    { key: 'twitter:description', name: 'twitter:description', content: description }
  ]
});
</script>
