<template>
  <div ref="mapContainer" class="h-[300px] w-full overflow-hidden rounded-lg bg-[#F8F4F0] sm:h-[360px]" />
</template>

<script setup lang="ts">
import {
  AttributionControl,
  LngLatBounds,
  Map as MaplibreMap,
  Marker,
  NavigationControl,
  Popup,
  setWorkerUrl,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { getMapStyle } from '~/helpers/mapStyles';
import type { MapPoint } from '~/composables/useCountPoints';

setWorkerUrl(workerUrl);

const MAX_ZOOM = 17;
const DEFAULT_COLOR = '#152B68';
const BOUNDS_PADDING = { top: 50, right: 40, bottom: 70, left: 40 };
const POPUP_OFFSET = 18;
const MAP_LOCALE = {
  'Map.Title': 'Carte',
  'NavigationControl.ZoomIn': 'Zoomer',
  'NavigationControl.ZoomOut': 'Dézoomer',
  'CooperativeGesturesHandler.WindowsHelpText': 'Utilisez Ctrl + molette pour zoomer sur la carte',
  'CooperativeGesturesHandler.MacHelpText': 'Utilisez ⌘ + molette pour zoomer sur la carte',
  'CooperativeGesturesHandler.MobileHelpText': 'Utilisez deux doigts pour déplacer la carte',
};

const props = defineProps<{ points: MapPoint[] }>();

const { mapStyle } = useSettings();
const mapContainer = ref<HTMLElement | null>(null);
let map: MaplibreMap | null = null;

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function popupHtml({ title, detail, color }: MapPoint): string {
  return `<div class="not-prose w-56 bg-white text-center"><div class="px-2 py-1 text-sm font-bold text-white" style="background-color: ${color ?? DEFAULT_COLOR}">${escapeHtml(title)}</div><div class="px-2 py-1 text-sm text-gray-700">${escapeHtml(detail)}</div></div>`;
}

onMounted(() => {
  if (!mapContainer.value || props.points.length === 0) {
    return;
  }

  const bounds = new LngLatBounds();
  for (const point of props.points) {
    bounds.extend(point.coordinates);
  }
  const fitOptions = { padding: BOUNDS_PADDING, maxZoom: MAX_ZOOM, duration: 0 };

  const currentMap = new MaplibreMap({
    container: mapContainer.value,
    style: getMapStyle(mapStyle.value),
    bounds,
    fitBoundsOptions: fitOptions,
    attributionControl: false,
    cooperativeGestures: true,
    locale: MAP_LOCALE,
  });
  map = currentMap;
  currentMap.addControl(new NavigationControl({ showCompass: false }), 'top-left');
  currentMap.addControl(new AttributionControl({ compact: true }), 'bottom-right');
  currentMap.on('load', () => {
    currentMap.fitBounds(bounds, fitOptions);
  });

  for (const point of props.points) {
    const element = document.createElement('div');
    element.className =
      'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white shadow-md';
    element.style.backgroundColor = point.color ?? DEFAULT_COLOR;
    element.textContent = point.label;
    new Marker({ element })
      .setLngLat(point.coordinates)
      .setPopup(
        new Popup({ closeButton: false, focusAfterOpen: false, offset: POPUP_OFFSET }).setHTML(popupHtml(point)),
      )
      .addTo(currentMap);
  }
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});
</script>
