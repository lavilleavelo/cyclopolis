<template>
  <div class="relative h-full w-full overflow-hidden">
    <!-- classe dynamique sur un parent plutot que sur le conteneur de la carte sinon vue ecrase les classes de maplibre -->
    <div :class="{ 'print:hidden': printImageUrl }">
      <div ref="mapContainer" class="absolute top-0 left-0" :style="containerStyle" />
    </div>
    <img v-if="printImageUrl" :src="printImageUrl" alt="" class="pointer-events-none absolute inset-0 h-full w-full" />
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import { type LngLatLike, Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  EXTRA_STREET_LABELS_ID,
  METRO_STATIONS_ID,
  OPTIONAL_STREET_LABELS_BEFORE_ID,
  OPTIONAL_STREET_LABELS_ID,
  PRIORITY_STREET_NAME_LAYER,
  TRAIN_STATIONS_ID,
  addMetroStationIcons,
  getExtraStreetLabels,
  getMetroStations,
  getTrainStations,
  getPrintMapStyle,
  isNeighbourhoodLabelLayer,
  isPlaceLabelLayer,
  isRaisedLabelLayer,
  scaleOverlayLayers,
} from '~/helpers/printMapStyle';
import { getEffectiveDpi, getPrintPixelRatio, getZoomForScale, mmToPx } from '~/helpers/print';
import settings from '~/print-config.json';

import streetLabels from '~/print-street-labels.json';
import transit from '~/print-transit.json';

const FALLBACK_MAX_CANVAS_SIZE = 4096;
const IDLE_TIMEOUT_MS = 60_000;

const props = defineProps<{
  features: Collections['voiesCyclablesGeojson']['features'];
  widthMm: number;
  heightMm: number;
  symbolScale: number;
  scaleDenominator: number;
}>();

const center = defineModel<[number, number] | null>('center', { required: true });

const emit = defineEmits<{
  ready: [];
}>();

const { loadImages, plotFeatures, highlightLines, raiseLayersBelowShields } = useMap({ print: true });

const mapContainer = ref<HTMLElement | null>(null);
const printImageUrl = ref<string | null>(null);
let map: MaplibreMap | null = null;
// seuls les déplacements faits par l'utilisateur sont enregistrés comme cadrage
let isProgrammaticMove = false;

function moveProgrammatically(move: () => void) {
  isProgrammaticMove = true;
  try {
    move();
  } finally {
    isProgrammaticMove = false;
  }
}

const renderScale = computed(() => props.symbolScale / 2 ** settings.extraTileZoom);

const containerStyle = computed(() => ({
  width: `${mmToPx(props.widthMm) / renderScale.value}px`,
  height: `${mmToPx(props.heightMm) / renderScale.value}px`,
  transform: `scale(${renderScale.value})`,
  transformOrigin: 'top left',
}));

function getPreviewPixelRatio(): number {
  return window.devicePixelRatio / 2 ** settings.extraTileZoom;
}

function getMaxCanvasSize(): number {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!gl) {
    return FALLBACK_MAX_CANVAS_SIZE;
  }

  const [maxViewportWidth, maxViewportHeight] = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as [number, number];
  const maxSize = Math.min(
    gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number,
    gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
    maxViewportWidth,
    maxViewportHeight,
  );
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return maxSize || FALLBACK_MAX_CANVAS_SIZE;
}

function waitForIdle(target: MaplibreMap): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Le rendu de la carte a pris trop de temps')), IDLE_TIMEOUT_MS);
    target.once('idle', () => {
      clearTimeout(timeout);
      resolve();
    });
    target.triggerRepaint();
  });
}

function getScaleZoom(latitude: number): number {
  return getZoomForScale({ latitude, scaleDenominator: props.scaleDenominator, symbolScale: renderScale.value });
}

function applyScaleZoom(target: MaplibreMap) {
  moveProgrammatically(() => target.setZoom(getScaleZoom(target.getCenter().lat)));
}

function recenter() {
  const target = map;
  if (!target) {
    return;
  }

  center.value = null;
  clearPrintImage();
  moveProgrammatically(() => target.jumpTo({ center: settings.center as LngLatLike }));
  applyScaleZoom(target);
}

// Une image s'imprime de façon fiable à sa résolution native, contrairement à un canvas WebGL. Elle est conservée
// jusqu'au prochain déplacement : certains navigateurs émettent `afterprint` avant la fin de l'impression.
async function renderPrintImage(dpi: number): Promise<number> {
  if (!map) {
    throw new Error("La carte n'est pas encore chargée");
  }

  const target = map;
  clearPrintImage();

  try {
    const pixelRatio = getPrintPixelRatio({ dpi, symbolScale: renderScale.value });
    moveProgrammatically(() => target.setPixelRatio(pixelRatio));
    await waitForIdle(target);

    // maplibre réduit de lui-même le pixel ratio si le canvas dépasse les limites du navigateur
    const canvas = target.getCanvas();
    const effectivePixelRatio = canvas.width / canvas.clientWidth;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
      throw new Error("Impossible de générer l'image de la carte");
    }

    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.src = url;
    await image.decode();
    printImageUrl.value = url;
    await nextTick();

    return getEffectiveDpi({ pixelRatio: effectivePixelRatio, symbolScale: renderScale.value });
  } finally {
    moveProgrammatically(() => target.setPixelRatio(getPreviewPixelRatio()));
  }
}

function clearPrintImage() {
  if (printImageUrl.value) {
    URL.revokeObjectURL(printImageUrl.value);
    printImageUrl.value = null;
  }
}

defineExpose({ recenter, renderPrintImage });

onMounted(() => {
  const maxCanvasSize = getMaxCanvasSize();

  const initialCenter = center.value ?? (settings.center as [number, number]);
  const style = getPrintMapStyle({
    detailZoomOffset: settings.detailZoomOffset,
    extraTileZoom: settings.extraTileZoom,
    paperBasemap: settings.paperBasemap,
    labelFonts: settings.labelFonts,
    priorityStreetNames: settings.priorityStreets,
    hiddenStreetNames: [...settings.hiddenStreets, ...settings.extraStreetLabels.map((label) => label.name)],
    hiddenPlaceNames: settings.hiddenPlaces,
    placeOffsets: settings.placeOffsets,
    streetOffsets: settings.streetOffsets,
    neighbourhoodTextSize: settings.neighbourhoodTextSize,
    streetTextSize: settings.streetTextSize,
  });
  const basemapLayerIds = new Set(style.layers.map((layer) => layer.id));

  map = new MaplibreMap({
    container: mapContainer.value!,
    style,
    pixelRatio: getPreviewPixelRatio(),
    center: initialCenter,
    zoom: getScaleZoom(initialCenter[1]),
    scrollZoom: false,
    boxZoom: false,
    doubleClickZoom: false,
    touchZoomRotate: false,
    keyboard: false,
    attributionControl: false,
    maxCanvasSize: [maxCanvasSize, maxCanvasSize],
    // nécessaire pour exporter le contenu du canvas
    canvasContextAttributes: { preserveDrawingBuffer: true },
    fadeDuration: 0,
    // redimensionnement explicite (cf. watchers), pour ne pas être pris pour un déplacement de l'utilisateur
    trackResize: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
  });

  const target = map;

  target.on('movestart', () => {
    if (!isProgrammaticMove) {
      clearPrintImage();
    }
  });

  target.on('moveend', () => {
    if (isProgrammaticMove) {
      return;
    }
    const { lng, lat } = target.getCenter();
    center.value = [lng, lat];
    applyScaleZoom(target);
  });

  target.on('load', async () => {
    try {
      await loadImages({ map: target, features: props.features });
      plotFeatures({ map: target, features: props.features });
      highlightLines({ map: target, selections: null });
      addMetroStationIcons(target, transit.lineColors);
      for (const { source, layer } of [
        getMetroStations({
          stations: transit.metroStations,
          streetTextSize: settings.streetTextSize,
          labelFonts: settings.labelFonts,
        }),
        getTrainStations({
          stations: transit.trainStations,
          streetTextSize: settings.streetTextSize,
          labelFonts: settings.labelFonts,
        }),
      ]) {
        target.addSource(layer.id, source);
        target.addLayer(layer);
      }

      const raisedLabelLayerIds = [...basemapLayerIds].filter(isRaisedLabelLayer);
      const postponedLayerIds = target
        .getStyle()
        .layers.map((layer) => layer.id)
        .filter((layerId) => layerId.startsWith('postponed-'));
      raiseLayersBelowShields({
        map: target,
        layerIds: [
          ...raisedLabelLayerIds.filter((layerId) => !isPlaceLabelLayer(layerId)),
          ...postponedLayerIds,
          ...raisedLabelLayerIds.filter(isNeighbourhoodLabelLayer),
          METRO_STATIONS_ID,
          TRAIN_STATIONS_ID,
          ...raisedLabelLayerIds.filter((layerId) => isPlaceLabelLayer(layerId) && !isNeighbourhoodLabelLayer(layerId)),
        ],
      });
      const extraStreetLabels = getExtraStreetLabels({
        labels: settings.extraStreetLabels,
        streetTextSize: settings.streetTextSize,
        streetOffsets: settings.streetOffsets,
        paperBasemap: settings.paperBasemap,
        labelFonts: settings.labelFonts,
      });
      target.addSource(EXTRA_STREET_LABELS_ID, extraStreetLabels.source);
      target.addLayer(extraStreetLabels.layer);
      const optionalStreetLabels = getExtraStreetLabels({
        labels: streetLabels.optionalStreetLabels,
        streetTextSize: settings.streetTextSize,
        streetOffsets: settings.streetOffsets,
        paperBasemap: settings.paperBasemap,
        labelFonts: settings.labelFonts,
        optional: true,
      });
      target.addSource(OPTIONAL_STREET_LABELS_ID, optionalStreetLabels.source);
      target.addLayer(optionalStreetLabels.layer, OPTIONAL_STREET_LABELS_BEFORE_ID);
      if (target.getLayer(PRIORITY_STREET_NAME_LAYER)) {
        target.moveLayer(PRIORITY_STREET_NAME_LAYER);
      }
      scaleOverlayLayers({
        map: target,
        basemapLayerIds,
        extraTileZoom: settings.extraTileZoom,
        lineWidthScale: settings.lineWidthScale,
      });
    } catch (e) {
      console.error('Error during print map load', e);
    } finally {
      emit('ready');
    }
  });

  watch(
    () => props.scaleDenominator,
    () => {
      clearPrintImage();
      applyScaleZoom(target);
    },
  );

  watch(
    () => [props.widthMm, props.heightMm, props.symbolScale],
    async () => {
      clearPrintImage();
      await nextTick();
      moveProgrammatically(() => target.resize());
      applyScaleZoom(target);
    },
  );
});

onUnmounted(() => {
  clearPrintImage();
  map?.remove();
  map = null;
});
</script>
