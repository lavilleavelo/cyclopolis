<template>
  <div class="relative">
    <LegendModal ref="legendModalComponent" />
    <FilterModal ref="filterModalComponent" @update="refreshFilters" />
    <div id="map" class="rounded-lg h-full w-full" />
    <img
      v-if="options.logo"
      class="my-0 absolute bottom-0 right-0 z-10"
      src="https://cyclopolis.lavilleavelo.org/logo-lvv-carte.png"
      width="75"
      height="75"
      :alt="`logo ${config.assoName}`"
    >
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import { Map, AttributionControl, GeolocateControl, NavigationControl, type StyleSpecification, type LngLatLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import style from '@/assets/style.json';
import LegendControl from '@/maplibre/LegendControl';
import FilterControl from '@/maplibre/FilterControl';
import FullscreenControl from '@/maplibre/FullscreenControl';
import ShrinkControl from '@/maplibre/ShrinkControl';

import { isLineStringFeature, type CompteurFeature, type LaneQuality, type LaneStatus, type LaneType } from '~/types';
import config from '~/config.json';

// const config = useRuntimeConfig();
// const maptilerKey = config.public.maptilerKey;

const defaultOptions = {
  logo: true,
  legend: true,
  filter: true,
  geolocation: false,
  fullscreen: false,
  onFullscreenControlClick: () => { },
  shrink: false,
  onShrinkControlClick: () => { }
};

const props = defineProps<{
  features: Collections['voiesCyclablesGeojson']['features'] | CompteurFeature[]
  options?: Partial<typeof defaultOptions>;
}>();

const options = { ...defaultOptions, ...props.options };

const legendModalComponent = ref<{ openModal: () => void } | null>(null);
const filterModalComponent = ref<{ openModal: () => void } | null>(null);

const {
  loadImages,
  plotFeatures,
  fitBounds,
  handleMapClick
} = useMap();

const statuses = ref(['planned', 'variante', 'done', 'postponed', 'variante-postponed', 'unknown', 'wip', 'tested']);
const types = ref(['bidirectionnelle', 'bilaterale', 'voie-bus', 'voie-bus-elargie', 'velorue', 'voie-verte', 'bandes-cyclables', 'zone-de-rencontre', 'aucun', 'inconnu']);
const qualities = ref(['satisfactory', 'unsatisfactory']);

const features = computed(() => {
  return (props.features ?? []).filter(feature => {
    if (isLineStringFeature(feature)) {
      return statuses.value.includes(feature.properties.status) &&
        types.value.includes(feature.properties.type) && qualities.value.includes(feature.properties.quality);
    }
    return true;
  });
});

function refreshFilters({ visibleStatuses, visibleTypes, visibleQualities }: { visibleStatuses: LaneStatus[]; visibleTypes: LaneType[]; visibleQualities: LaneQuality[] }) {
  statuses.value = visibleStatuses;
  types.value = visibleTypes;
  qualities.value = visibleQualities;
}

onMounted(() => {
  const map = new Map({
    container: 'map',
    style: style as StyleSpecification,
    // style: `https://api.maptiler.com/maps/dataviz/style.json?key=${maptilerKey}`,
    center: config.center as LngLatLike,
    zoom: config.zoom,
    attributionControl: false
  });
  map.addControl(new NavigationControl({ showCompass: false }), 'top-left');
  map.addControl(new AttributionControl({ compact: false }), 'bottom-left');
  if (options.fullscreen) {
    const fullscreenControl = new FullscreenControl({
      onClick: () => options.onFullscreenControlClick()
    });
    map.addControl(fullscreenControl, 'top-right');
  }
  if (options.geolocation) {
    map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        // When active the map will receive updates to the device's location as it changes.
        trackUserLocation: true
      }),
      'top-right'
    );
  }
  if (options.shrink) {
    const shrinkControl = new ShrinkControl({
      onClick: () => options.onShrinkControlClick()
    });
    map.addControl(shrinkControl, 'top-right');
  }
  if (options.legend) {
    const legendControl = new LegendControl({
      onClick: () => {
        if (legendModalComponent.value) {
          (legendModalComponent.value).openModal();
        }
      }
    });
    map.addControl(legendControl, 'top-right');
  }
  if (options.filter) {
    const filterControl = new FilterControl({
      onClick: () => {
        if (filterModalComponent.value) {
          (filterModalComponent.value).openModal();
        }
      }
    });
    map.addControl(filterControl, 'top-right');
  }

  map.on('load', async() => {
    await loadImages({ map });
    plotFeatures({ map, features: features.value });

    const tailwindMdBreakpoint = 768;
    if (window.innerWidth > tailwindMdBreakpoint) {
      fitBounds({ map, features: features.value });
    }
  });

  watch(features, newFeatures => {
    plotFeatures({ map, features: newFeatures });
  });

  watch(() => props.features, newFeatures => {
    plotFeatures({ map, features: newFeatures });
  });

  map.on('click', clickEvent => {
    handleMapClick({ map, features: features.value, clickEvent });
  });
});
</script>

<style>
.maplibregl-popup-content {
  @apply p-0 rounded-lg overflow-hidden;
}

.maplibregl-info {
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: auto;
  background-image: url('~/maplibre/info.svg');
  background-size: 85%;
}

.maplibregl-fullscreen {
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: auto;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='29' height='29' fill='%23333'%3E%3Cpath d='M24 16v5.5c0 1.75-.75 2.5-2.5 2.5H16v-1l3-1.5-4-5.5 1-1 5.5 4 1.5-3h1zM6 16l1.5 3 5.5-4 1 1-4 5.5 3 1.5v1H7.5C5.75 24 5 23.25 5 21.5V16h1zm7-11v1l-3 1.5 4 5.5-1 1-5.5-4L6 13H5V7.5C5 5.75 5.75 5 7.5 5H13zm11 2.5c0-1.75-.75-2.5-2.5-2.5H16v1l3 1.5-4 5.5 1 1 5.5-4 1.5 3h1V7.5z'/%3E%3C/svg%3E");
}

.maplibregl-filter {
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: auto;
  background-image: url('~/maplibre/filter.svg');
  background-size: 85%;
}

.maplibregl-shrink {
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: auto;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='29' height='29'%3E%3Cpath d='M18.5 16c-1.75 0-2.5.75-2.5 2.5V24h1l1.5-3 5.5 4 1-1-4-5.5 3-1.5v-1h-5.5zM13 18.5c0-1.75-.75-2.5-2.5-2.5H5v1l3 1.5L4 24l1 1 5.5-4 1.5 3h1v-5.5zm3-8c0 1.75.75 2.5 2.5 2.5H24v-1l-3-1.5L25 5l-1-1-5.5 4L17 5h-1v5.5zM10.5 13c1.75 0 2.5-.75 2.5-2.5V5h-1l-1.5 3L5 4 4 5l4 5.5L5 12v1h5.5z'/%3E%3C/svg%3E");
}

.maplibregl-popup-anchor-top .maplibregl-popup-tip,
.maplibregl-popup-anchor-top-left .maplibregl-popup-tip,
.maplibregl-popup-anchor-top-right .maplibregl-popup-tip {
  border-bottom-color: transparent;
}

.maplibregl-popup-anchor-bottom .maplibregl-popup-tip,
.maplibregl-popup-anchor-bottom-left .maplibregl-popup-tip,
.maplibregl-popup-anchor-bottom-right .maplibregl-popup-tip {
  border-top-color: transparent;
}

.maplibregl-popup-anchor-left .maplibregl-popup-tip {
  border-right-color: transparent;
}

.maplibregl-popup-anchor-right .maplibregl-popup-tip {
  border-left-color: transparent;
}
</style>
