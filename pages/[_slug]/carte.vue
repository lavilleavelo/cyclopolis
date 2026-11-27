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
import MapPlaceholder from '~/components/MapPlaceholder.vue';
import { getLineFileName } from '~/helpers/lines';

const { path } = useRoute();
const { getLineFromPath } = useUrl();
const { getLineName } = useConfig();

const line = getLineFromPath(path) ?? NaN;

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen',
  middleware: 'voie-cyclable',
});

const mapOptions = {
  shrink: true,
  canUseSidePanel: true,
  showDetailsPanel: true,
  updateUrlOnFeatureClick: true,
  onShrinkControlClick: () => {
    const route = useRoute();
    return navigateTo({ path: `/${route.params._slug}` });
  },
};

const { data: geojson } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesGeojson')
    .path(`/voies-cyclables/${getLineFileName(line)}`)
    .first();
});

const features: Ref<Collections['voiesCyclablesGeojson']['features']> = computed(() => {
  if (!geojson.value) return [];
  return geojson.value.features;
});

const { filters, actions, filteredFeatures, totalDistance, filteredDistance } = useBikeLaneFilters({
  allFeatures: features,
});

const lineName = getLineName(line);
const description = `Carte de la ${lineName}. Découvrez les tronçons prévus, déjà réalisés, en travaux et ceux souhaités.`;
useHead({
  title: `Carte de la ${lineName}`,
  meta: [
    // description
    { key: 'description', name: 'description', content: description },
    { key: 'og:description', property: 'og:description', content: description },
    { key: 'twitter:description', name: 'twitter:description', content: description },
  ],
});
</script>
