<template>
  <div>
    <div v-if="geojson">
      <div class="text-center text-xl text-gray-900">
        Distance totale:
        <span class="font-bold" :style="`color: ${color}`">{{ displayDistanceInKm(distance, 1) }}</span>
      </div>
      <div v-if="voie.trafic" class="text-center text-sm text-gray-900">
        Fréquentation max 2030: <span class="font-bold" :style="`color: ${color}`">{{ voie.trafic }}</span>
      </div>
      <ProgressBar :voies="[geojson]" />
      <Stats :voies="[geojson]" :precision="1" />
      <StatsQuality v-if="displayQuality()" :voies="[geojson]" :precision="1" />
      <Typology :voies="[geojson]" />
    </div>
    <section aria-labelledby="shipping-heading" class="mt-10">
      <ClientOnly fallback-tag="div">
        <template #fallback>
          <MapPlaceholder :custom-style="{ height: '40vh' }" />
        </template>
        <Map
          :features="filteredFeatures"
          :options="mapOptions"
          style="height: 40vh"
          :total-distance="totalDistance"
          :filtered-distance="filteredDistance"
          :filters="filters"
          :actions="actions"
        />
      </ClientOnly>

      <div class="mt-2 flex justify-end gap-4">
        <button
          type="button"
          title="Télécharger le tracé au format GPX"
          class="flex items-center gap-2 text-base font-semibold text-gray-500 hover:text-lvv-blue-600 no-underline"
          @click="downloadGpx"
        >
          <span>GPX</span>
          <Icon name="mdi:download" class="h-5 w-5" aria-hidden="true" />
        </button>
        <a
          :href="linkToGeoJSON"
          target="_blank"
          title="Voir le fichier GEOJSON sur GitHub"
          class="flex items-center gap-2 text-base font-semibold text-gray-500 hover:text-lvv-blue-600 no-underline"
          rel="noopener noreferrer"
        >
          <span>GEOJSON</span>
          <Icon name="mdi:open-in-new" class="h-5 w-5" aria-hidden="true" />
        </a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import GeoJsonToGpx from '@dwayneparton/geojson-to-gpx';
import MapPlaceholder from '~/components/MapPlaceholder.vue';
import { useBikeLaneFilters } from '~/composables/useBikeLaneFilters';

const { path } = useRoute();
const { getLineColor } = useColors();
const { getTotalDistance, displayDistanceInKm } = useStats();
const { displayQuality } = useConfig();

const { voie } = defineProps<{ voie: Collections['voiesCyclablesPage'] }>();

const mapOptions = {
  fullscreen: true,
  onFullscreenControlClick: () => {
    const route = useRoute();
    return navigateTo({ path: `${route.params._slug}/carte` });
  }
};

const { data: geojson } = await useAsyncData(`geojson-${path}`, () => {
  return queryCollection('voiesCyclablesGeojson').path(voie.path).first();
});

const features: Ref<Collections['voiesCyclablesGeojson']['features']> = computed(() => geojson.value?.features || []);

const { filters, actions, filteredFeatures, totalDistance, filteredDistance } = useBikeLaneFilters({
  allFeatures: features
});

const color = getLineColor(Number(voie.line));
const distance = geojson.value ? getTotalDistance([geojson.value]) : 0;

const linkToGeoJSON = `https://github.com/lavilleavelo/cyclopolis/blob/main/content/voies-cyclables/ligne-${voie.line}.json`;

function downloadGpx() {
  if (!geojson.value) {
    return;
  }

  const gpx = GeoJsonToGpx(geojson.value, {
    creator: 'Cyclopolis - La Ville à Vélo',
    metadata: {
      name: `Voie Lyonnaise ${voie.line}`,
      desc: `Tracé de la voie lyonnaise ${voie.line} - Source: La Ville à Vélo`,
      author: {
        name: 'Cyclopolis - La Ville à Vélo',
        link: {
          href: `https://cyclopolis.fr/voie-lyonnaise-${voie.line}`,
          text: 'Cyclopolis - La Ville à Vélo'
        }
      }
    }
  });

  const gpxString = new XMLSerializer().serializeToString(gpx);
  const dataStr = `data:application/gpx+xml;charset=utf-8,${encodeURIComponent(gpxString)}`;

  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', `voie-lyonaise-${voie.line}.gpx`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
</script>
