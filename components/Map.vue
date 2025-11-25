<template>
  <div class="relative">
    <LegendModal ref="legendModalComponent" />

    <div class="flex rounded-lg h-full w-full">
      <div id="map" :class="[options.roundedCorners ? 'rounded-lg' : '', 'h-full w-full']" />
      <FilterPanel
        :show-line-filters="options.showLineFilters"
        :show-date-filter="options.showDateFilter"
        :can-use-side-panel="options.canUseSidePanel"
        :filters="filters"
        :actions="actions"
        :filter-style="options.filterStyle"
      />
    </div>

    <div
      v-if="totalDistance"
      class="absolute top-3 left-12 bg-white p-1 text-sm rounded-md shadow cursor-pointer select-none"
      @click="toggleFilterSidebar"
    >
      Réseau affiché: {{ displayDistanceInKm(filteredDistance || 0, 1) }} ({{
        displayPercent(Math.round(((filteredDistance || 0) / totalDistance) * 100))
      }})
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import {
  Map,
  AttributionControl,
  GeolocateControl,
  NavigationControl,
  type StyleSpecification,
  type LngLatLike,
  LngLat,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import style from '@/assets/style.json';
import LegendControl from '@/maplibre/LegendControl';
import LegendInlineControl from '@/maplibre/LegendInlineControl';
import FilterControl from '@/maplibre/FilterControl';
import FullscreenControl from '@/maplibre/FullscreenControl';
import ShrinkControl from '@/maplibre/ShrinkControl';
import LogoControl from '@/maplibre/LogoControl';

import type { CompteurFeature, FiltersState, FilterActions } from '~/types';
import config from '~/config.json';
import FilterPanel from '~/components/FilterPanel.vue';
import LegendInline from '~/components/LegendInline.vue';
const { displayDistanceInKm, displayPercent } = useStats();

const defaultOptions = {
  logo: true,
  legend: true,
  filter: true,
  geolocation: false,
  fullscreen: false,
  onFullscreenControlClick: () => {},
  shrink: false,
  showLineFilters: false,
  showDateFilter: false,
  canUseSidePanel: false,
  onShrinkControlClick: () => {},
  filterStyle: 'height: calc(100vh - 100px)',
  roundedCorners: false,
  updateUrlOnFeatureClick: false,
};

const props = defineProps<{
  features: Collections['voiesCyclablesGeojson']['features'] | CompteurFeature[];
  options?: Partial<typeof defaultOptions>;
  totalDistance?: number;
  filteredDistance?: number;
  geojsons?: Collections['voiesCyclablesGeojson'][];
  filters?: FiltersState;
  actions?: FilterActions;
}>();

const options = { ...defaultOptions, ...props.options };

const legendModalComponent = ref<{ openModal: () => void } | null>(null);
const filterControl = ref<FilterControl | null>(null);

const { loadImages, plotFeatures, fitBounds, handleMapClick } = useMap({
  updateUrlOnFeatureClick: options.updateUrlOnFeatureClick,
});

const router = useRouter();
const route = useRoute();

const highlightLine = route.query.line ? Number(route.query.line) : undefined;
const highlightSection = route.query.sectionName as string | undefined;

function toggleFilterSidebar() {
  if (!props.filters || !props.actions) {
    return;
  }

  const query = { ...route.query };
  if (query.modal === 'filters') {
    delete query.modal;
  } else {
    query.modal = 'filters';
  }
  router.replace({ query });
}

onMounted(() => {
  const map = new Map({
    container: 'map',
    style: style as StyleSpecification,
    // style: `https://api.maptiler.com/maps/dataviz/style.json?key=${maptilerKey}`,
    center: config.center as LngLatLike,
    zoom: config.zoom,
    attributionControl: false,
  });

  map.addControl(new NavigationControl({ showCompass: false }), 'top-left');
  map.addControl(new AttributionControl({ compact: false }), 'bottom-left');

  if (options.fullscreen) {
    const fullscreenControl = new FullscreenControl({
      onClick: () => options.onFullscreenControlClick(),
    });
    map.addControl(fullscreenControl, 'top-right');
  }

  if (options.geolocation) {
    map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        // When active the map will receive updates to the device's location as it changes.
        trackUserLocation: true,
      }),
      'top-right',
    );
  }

  if (options.shrink) {
    const shrinkControl = new ShrinkControl({
      onClick: () => options.onShrinkControlClick(),
    });
    map.addControl(shrinkControl, 'top-right');
  }

  if (options.legend) {
    // Define breakpoint for showing inline legend (e.g., 1024px = large screens)
    const legendInlineBreakpoint = 1024;
    const isLargeMap = window.innerWidth >= legendInlineBreakpoint && !options.fullscreen;

    if (isLargeMap) {
      // Show inline legend in bottom-left corner for large screens
      const legendInlineControl = new LegendInlineControl(LegendInline);
      map.addControl(legendInlineControl, 'bottom-left');
    } else {
      // Show legend button for smaller screens
      const legendControl = new LegendControl({
        onClick: () => {
          if (legendModalComponent.value) {
            legendModalComponent.value.openModal();
          }
        },
      });
      map.addControl(legendControl, 'top-right');
    }
  }

  if (options.filter) {
    filterControl.value = new FilterControl({
      onClick: () => {
        toggleFilterSidebar();
      },
    });
    map.addControl(filterControl.value, 'top-right');
  }

  if (options.logo) {
    const logoControl = new LogoControl({
      src: 'https://cyclopolis.lavilleavelo.org/logo-lvv-carte.png',
      alt: `logo ${config.assoName}`,
      width: 75,
      height: 75,
    });
    map.addControl(logoControl, 'bottom-right');
  }

  map.on('load', async () => {
    await loadImages({ map });
    plotFeatures({ map, features: props.features });

    if (highlightLine && highlightSection) {
      const section = props.features.find((f) => {
        if (f.geometry.type !== 'LineString') {
          return false;
        }
        if (!('line' in f.properties) || f.properties.line !== highlightLine) {
          return false;
        }
        return 'name' in f.properties && f.properties.name === highlightSection;
      });

      if (section?.geometry?.type === 'LineString') {
        fitBounds({ map, features: [section] });

        map.once('moveend', () => {
          const coordinates = section.geometry.coordinates;
          const midPoint = coordinates[Math.floor(coordinates.length / 2)] as [number, number];
          const point = map.project(midPoint);

          const renderedFeatures = map.queryRenderedFeatures(point, {
            layers: ['highlight'],
            filter: [
              'all',
              ['==', ['get', 'line'], section.properties.line],
              ['==', ['get', 'name'], section.properties.name],
            ],
          });

          const firstFeatureId = renderedFeatures?.[0].id;
          if (firstFeatureId !== undefined) {
            map.setFeatureState({ source: 'all-sections', id: firstFeatureId }, { hover: true });
          }

          if (!midPoint || midPoint?.length !== 2) {
            return;
          }

          // small hack: simulate a click event to open the popup
          handleMapClick({
            map,
            features: props.features,
            clickEvent: {
              lngLat: new LngLat(midPoint[0], midPoint[1]),
              point,
              originalEvent: new MouseEvent('click'),
              target: map,
              type: 'click',
              preventDefault: () => {},
              defaultPrevented: false,
              _defaultPrevented: false,
            },
          });
        });
      }
    } else {
      const tailwindMdBreakpoint = 768;
      if (window.innerWidth > tailwindMdBreakpoint) {
        fitBounds({ map, features: props.features });
      }
    }
  });

  watch(
    () => props.features,
    (newFeatures) => {
      try {
        plotFeatures({ map, features: newFeatures });
      } catch (e) {
        console.warn('not able to plot features', e);
      }
    },
  );

  watch(
    () => [props.totalDistance, props.filteredDistance],
    ([totalDistance, filteredDistance]) => {
      if (filterControl.value && totalDistance && filteredDistance !== undefined) {
        filterControl.value.setActive(totalDistance - filteredDistance > 0);
      }
    },
    { immediate: true },
  );

  map.on('click', (clickEvent) => {
    handleMapClick({ map, features: props.features, clickEvent });
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

.maplibregl-logo-control {
  box-shadow: none;
  background: transparent;
  padding: 0;
  margin: 0 !important;
}

.maplibregl-logo-control img {
  display: block;
  margin: 0;
  pointer-events: auto;
}
</style>
