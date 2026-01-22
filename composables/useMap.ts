import type { Collections } from '@nuxt/content';
import type maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MaplibreType } from 'maplibre-gl';
import { LngLatBounds, Popup } from 'maplibre-gl';
import { createApp, defineComponent, h, Suspense, watch } from 'vue';
import {
  type CompteurFeature,
  isCompteurFeature,
  isDangerFeature,
  isLineStringFeature,
  isPerspectiveFeature,
  isPointFeature,
} from '~/types';
// Tooltips
import PerspectiveTooltip from '~/components/tooltips/PerspectiveTooltip.vue';
import CounterTooltip from '~/components/tooltips/CounterTooltip.vue';
import DangerTooltip from '~/components/tooltips/DangerTooltip.vue';
import LineTooltip from '~/components/tooltips/LineTooltip.vue';
import LineHoverTooltip from '~/components/tooltips/LineHoverTooltip.vue';

import type { LocationQueryRaw } from 'vue-router';
import {
  sortByLine,
  getCrossIconUrl,
  createLineShieldIcon,
  createCompositeLineShieldIcon,
  createConstructionIcon,
  normalizeLineDirection,
  addCompositeIconNames,
  getUsedCompositeIcons,
  groupFeaturesByColor,
} from '~/helpers/map-utils';
import { type CanvasDashAnimator, createCanvasDashAnimator } from '~/helpers/canvas-animator';

const DIMMED_OPACITY = 0.2;
const NORMAL_OPACITY = 1;
const HIGHLIGHTED_SECTION_OPACITY = 1;

type ColoredLineStringFeature = Extract<
  Collections['voiesCyclablesGeojson']['features'][0],
  { geometry: { type: 'LineString' } }
> & { properties: { color: string; showLabel?: boolean } };
const { getNbVoiesCyclables } = useConfig();

export const useMap = ({ updateUrlOnFeatureClick }: { updateUrlOnFeatureClick?: boolean } = {}) => {
  const { getLineColor } = useColors();
  const { getLineStringDistance } = useStats();
  const router = useRouter();
  const route = useRoute();
  const { extractLineAndAnchorFromPath } = useUrl();

  let currentHoverPopup: maplibregl.Popup | null = null;
  let currentClickPopup: maplibregl.Popup | null = null;
  let lastHoveredFeatureId: string | null = null;
  let lastClickedFeatureId: string | null = null;
  let wipAnimator: CanvasDashAnimator | null = null;
  let currentMap: MaplibreType | null = null;
  const shieldImages: Map<string, HTMLCanvasElement> = new Map();

  function addLineColor(
    feature: Extract<Collections['voiesCyclablesGeojson']['features'][0], { geometry: { type: 'LineString' } }>,
  ): ColoredLineStringFeature {
    return {
      ...feature,
      properties: {
        color: getLineColor(feature.properties.line),
        ...feature.properties,
      },
    };
  }

  function upsertMapSource(
    map: MaplibreType,
    sourceName: string,
    features: Collections['voiesCyclablesGeojson']['features'] | CompteurFeature[],
  ) {
    if (!map || !map.getSource) {
      return false;
    }

    const source = map.getSource(sourceName) as GeoJSONSource;
    if (source) {
      source.setData({ type: 'FeatureCollection', features });
      return true;
    }
    map.addSource(sourceName, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });
    return false;
  }

  async function loadImages({
    map,
    features,
    force = false,
  }: {
    map: MaplibreType;
    features?: Array<Collections['voiesCyclablesGeojson']['features'][0] | CompteurFeature>;
    force?: boolean;
  }) {
    const imagesToLoad = [
      { id: 'camera-icon', url: '/icons/camera.png', sdf: true },
      { id: 'pump-icon', url: '/icons/pump.png', sdf: true },
      { id: 'danger-icon', url: '/icons/danger.png', sdf: false },
      { id: 'cross-icon', url: getCrossIconUrl(), sdf: true },
    ];

    await Promise.all(
      imagesToLoad.map(async ({ id, url, sdf }) => {
        if (map.hasImage(id)) {
          return;
        }
        const image = await map.loadImage(url);
        if (image) {
          map.addImage(id, image.data, { sdf });
        }
      }),
    );

    const constructionIconId = 'construction-icon';
    if (!map.hasImage(constructionIconId) || force) {
      if (force && map.hasImage(constructionIconId)) map.removeImage(constructionIconId);
      const canvas = createConstructionIcon();
      const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
      if (imageData) {
        map.addImage(constructionIconId, imageData, { sdf: false });
      }
    }

    const totalLines = getNbVoiesCyclables();

    for (let line = 1; line <= totalLines; line++) {
      const id = `line-shield-${line}`;
      if (map.hasImage(id)) {
        if (!force) {
          continue;
        }
        map.removeImage(id);
      }

      const color = getLineColor(line);
      const canvas = createLineShieldIcon(line, color);
      const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
      if (imageData) {
        map.addImage(id, imageData);
        shieldImages.set(id, canvas);
      }
    }

    const compositeIcons = getUsedCompositeIcons(features as Collections['voiesCyclablesGeojson']['features']);

    compositeIcons.forEach((combo) => {
      const id = `line-shield-${combo}`;
      if (map.hasImage(id)) {
        if (!force) {
          return;
        }
        map.removeImage(id);
      }

      const lineNumbers = combo.split('-').map(Number);
      const colors = lineNumbers.map((line) => getLineColor(line));
      const canvas = createCompositeLineShieldIcon(lineNumbers, colors);
      const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
      if (imageData) {
        map.addImage(id, imageData);
        shieldImages.set(id, canvas);
      }
    });
  }

  function plotUnsatisfactorySections({ map, features }: { map: MaplibreType; features: ColoredLineStringFeature[] }) {
    if (features.length === 0 && !map.getLayer('unsatisfactory-sections')) {
      return;
    }

    if (upsertMapSource(map, 'unsatisfactory-sections', features as Collections['voiesCyclablesGeojson']['features'])) {
      return;
    }

    map.addLayer({
      id: 'unsatisfactory-sections',
      type: 'line',
      source: 'unsatisfactory-sections',
      minzoom: 13,
      paint: {
        'line-gap-width': 5,
        'line-width': 4,
        'line-color': '#c84271',
        'line-dasharray': [0.8, 0.8],
      },
    });
  }

  function plotUnderlinedSections({ map, features }: { map: MaplibreType; features: ColoredLineStringFeature[] }) {
    if (features.length === 0 && !map.getLayer('highlight-layer')) {
      return;
    }

    const allButWipTestedFeatures = features.filter(
      (feature) => feature.properties.status !== 'wip' && feature.properties.status !== 'tested',
    );

    upsertMapSource(
      map,
      'all-but-wip-sections',
      allButWipTestedFeatures as Collections['voiesCyclablesGeojson']['features'],
    );

    const allButWipTestedFeaturesLowZoom = allButWipTestedFeatures.filter((feature) => {
      const distance = getLineStringDistance(feature);
      return distance >= 900;
    });
    upsertMapSource(
      map,
      'all-but-wip-sections-low-zoom',
      allButWipTestedFeaturesLowZoom as Collections['voiesCyclablesGeojson']['features'],
    );

    const allButWipTestedFeaturesHighZoom = allButWipTestedFeatures.filter((feature) => feature.properties.showLabel);
    upsertMapSource(
      map,
      'all-but-wip-sections-high-zoom',
      allButWipTestedFeaturesHighZoom as Collections['voiesCyclablesGeojson']['features'],
    );

    if (upsertMapSource(map, 'all-sections', features as Collections['voiesCyclablesGeojson']['features'])) {
      return;
    }

    map.addLayer({
      id: 'selected-layer',
      type: 'line',
      source: 'all-sections',
      layout: { 'line-cap': 'round' },
      paint: {
        'line-gap-width': 5,
        'line-width': 4,
        'line-color': 'rgba(0, 0, 0, 0.0)',
      },
    });

    map.addLayer({
      id: 'highlight-layer',
      type: 'line',
      source: 'all-sections',
      layout: { 'line-cap': 'round' },
      paint: {
        'line-gap-width': 5,
        'line-width': 4,
        'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#433E61', 'rgba(255,255,255,0)'],
      },
    });

    map.addLayer({
      id: 'contour-layer',
      type: 'line',
      source: 'all-sections',
      layout: { 'line-cap': 'round' },
      paint: {
        'line-gap-width': 4,
        'line-width': 1,
        'line-color': 'rgba(0, 0, 0, 0.0)',
      },
    });

    map.addLayer({
      id: 'underline-layer',
      type: 'line',
      source: 'all-sections',
      paint: {
        'line-width': 4,
        'line-color': '#ffffff',
      },
    });

    // Count unique lines to determine if section-names layers should be added
    const uniqueLines = new Set(
      features.map((feature) => ('line' in feature.properties ? feature.properties.line : null)).filter(Boolean),
    );
    const shouldAddSectionNames = uniqueLines.size > 2;

    if (shouldAddSectionNames) {
      map.addLayer({
        id: 'section-names-low-zoom',
        type: 'symbol',
        source: 'all-but-wip-sections-low-zoom',
        maxzoom: 13,
        layout: {
          'icon-image': ['coalesce', ['get', 'compositeIconName'], ['concat', 'line-shield-', ['get', 'line']]],
          'icon-size': 0.3,
          'symbol-spacing': 1000000,
          'symbol-placement': 'line-center',
          'symbol-sort-key': ['-', ['get', 'line']],
          'icon-rotation-alignment': 'viewport',
        },
      });

      map.addLayer({
        id: 'section-names',
        type: 'symbol',
        source: 'all-but-wip-sections-high-zoom',
        minzoom: 13,
        maxzoom: 17,
        layout: {
          'icon-image': ['coalesce', ['get', 'compositeIconName'], ['concat', 'line-shield-', ['get', 'line']]],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.3, 15, 0.3, 17, 0.4],
          'symbol-spacing': 1000000,
          'symbol-placement': 'line-center',
          'symbol-sort-key': ['-', ['get', 'line']],
        },
      });

      map.addLayer({
        id: 'section-names-high-zoom',
        type: 'symbol',
        source: 'all-but-wip-sections',
        minzoom: 17,
        layout: {
          'icon-image': ['coalesce', ['get', 'compositeIconName'], ['concat', 'line-shield-', ['get', 'line']]],
          'icon-size': 0.4,
          'symbol-spacing': 1000000,
          'symbol-placement': 'line-center',
          'symbol-sort-key': ['-', ['get', 'line']],
        },
      });
    }

    map.setPaintProperty('contour-layer', 'line-color', '#000');

    let hoveredLineId: string | number | null = null;
    map.on('mousemove', 'highlight-layer', (e: maplibregl.MapMouseEvent) => {
      map.getCanvas().style.cursor = 'pointer';
      const features = map.queryRenderedFeatures(e.point, { layers: ['highlight-layer'] });
      if (features.length > 0) {
        if (hoveredLineId !== null) {
          map.setFeatureState({ source: 'all-sections', id: hoveredLineId }, { hover: false });
        }
        if (features[0]?.id !== undefined) {
          hoveredLineId = features[0].id;
          if (hoveredLineId !== null) {
            map.setFeatureState({ source: 'all-sections', id: hoveredLineId }, { hover: true });
          }
        }
      }
    });
    map.on('mouseleave', 'highlight-layer', () => {
      map.getCanvas().style.cursor = '';
      if (hoveredLineId !== null) {
        map.setFeatureState({ source: 'all-sections', id: hoveredLineId }, { hover: false });
      }
      hoveredLineId = null;
    });
  }

  function plotDoneSections({ map, features }: { map: MaplibreType; features: ColoredLineStringFeature[] }) {
    // si il n'y a rien a afficher et que la couche n'existe pas, on ne fait rien
    // si elle existe déjà, on la maj (carte dynamique par année)
    if (features.length === 0 && !map.getLayer('done-sections')) {
      return;
    }
    if (upsertMapSource(map, 'done-sections', features as Collections['voiesCyclablesGeojson']['features'])) {
      return;
    }

    map.addLayer({
      id: 'done-sections',
      type: 'line',
      source: 'done-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color'],
      },
    });
  }

  function plotWipSections({ map, features }: { map: MaplibreType; features: ColoredLineStringFeature[] }) {
    currentMap = map;
    if (features.length === 0 && !map.getLayer('wip-sections')) {
      return;
    }

    if (wipAnimator) {
      wipAnimator.setFeatures(features);
    } else {
      wipAnimator = createCanvasDashAnimator(map, features);
    }
    wipAnimator.setImages(shieldImages);
    wipAnimator.setVisible(!reduceMotion.value);

    if (upsertMapSource(map, 'wip-sections', features as Collections['voiesCyclablesGeojson']['features'])) {
      return;
    }

    map.addLayer({
      id: 'wip-sections',
      type: 'line',
      source: 'wip-sections',
      paint: {
        'line-width': 4,
        'line-color': reduceMotion.value ? ['get', 'color'] : 'rgba(0, 0, 0, 0)',
        'line-dasharray': reduceMotion.value ? [2, 2] : undefined,
      },
    });

    map.addLayer({
      id: 'wip-node-icons',
      type: 'symbol',
      source: 'wip-sections',
      layout: {
        'icon-image': 'construction-icon',
        'icon-size': 0.5,
        'symbol-placement': 'line',
        'symbol-spacing': ['interpolate', ['linear'], ['zoom'], 13, 80, 16, 250],
        'icon-allow-overlap': true,
        'icon-anchor': 'bottom',
        visibility: reduceMotion.value ? 'visible' : 'none',
      },
    });

    map.addLayer({
      id: 'wip-shields',
      type: 'symbol',
      source: 'wip-sections',
      layout: {
        'icon-image': ['coalesce', ['get', 'compositeIconName'], ['concat', 'line-shield-', ['get', 'line']]],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.3, 15, 0.3, 17, 0.4],
        'symbol-placement': 'line-center',
        'symbol-spacing': 1000000,
        visibility: reduceMotion.value ? 'visible' : 'none',
      },
    });
  }

  const { reduceMotion } = useSettings();

  watch(
    reduceMotion,
    (shouldReduce) => {
      if (!currentMap) return;

      const visibility = shouldReduce ? 'visible' : 'none';
      if (currentMap.getLayer('wip-node-icons')) {
        currentMap.setLayoutProperty('wip-node-icons', 'visibility', visibility);
      }
      if (currentMap.getLayer('wip-shields')) {
        currentMap.setLayoutProperty('wip-shields', 'visibility', visibility);
      }

      if (currentMap.getLayer('wip-sections')) {
        if (shouldReduce) {
          currentMap.setPaintProperty('wip-sections', 'line-color', ['get', 'color']);
          currentMap.setPaintProperty('wip-sections', 'line-dasharray', [2, 2]);
        } else {
          currentMap.setPaintProperty('wip-sections', 'line-color', 'rgba(0, 0, 0, 0)');
        }
      }

      if (wipAnimator) {
        wipAnimator.setVisible(!shouldReduce);
      }
    },
    { immediate: true },
  );

  function plotPlannedSections({ map, features }: { map: MaplibreType; features: ColoredLineStringFeature[] }) {
    if (features.length === 0 && !map.getLayer('planned-sections')) {
      return;
    }
    if (upsertMapSource(map, 'planned-sections', features as Collections['voiesCyclablesGeojson']['features'])) {
      return;
    }

    map.addLayer({
      id: 'planned-sections',
      type: 'line',
      source: 'planned-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color'],
        'line-dasharray': [2, 4],
      },
    });
  }

  function plotVarianteSections({ map, features }: { map: MaplibreType; features: ColoredLineStringFeature[] }) {
    if (features.length === 0 && !map.getLayer('variante-sections')) {
      return;
    }
    if (upsertMapSource(map, 'variante-sections', features as Collections['voiesCyclablesGeojson']['features'])) {
      return;
    }

    map.addLayer({
      id: 'variante-sections',
      type: 'line',
      source: 'variante-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color'],
        'line-dasharray': [2, 2],
        'line-opacity': 0.5,
      },
    });
    map.addLayer({
      id: 'variante-symbols',
      type: 'symbol',
      source: 'variante-sections',
      paint: {
        'text-halo-color': '#fff',
        'text-halo-width': 4,
      },
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 120,
        'text-font': ['Open Sans Regular'],
        'text-field': ['coalesce', ['get', 'text'], 'variante'],
        'text-size': 14,
      },
    });

    map.on('mouseenter', 'variante-sections', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'variante-sections', () => (map.getCanvas().style.cursor = ''));
  }

  function plotVariantePostponedSections({
    map,
    features,
  }: {
    map: MaplibreType;
    features: ColoredLineStringFeature[];
  }) {
    if (features.length === 0 && !map.getLayer('variante-postponed-sections')) {
      return;
    }
    if (
      upsertMapSource(map, 'variante-postponed-sections', features as Collections['voiesCyclablesGeojson']['features'])
    ) {
      return;
    }

    map.addLayer({
      id: 'variante-postponed-sections',
      type: 'line',
      source: 'variante-postponed-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color'],
        'line-dasharray': [2, 2],
        'line-opacity': 0.5,
      },
    });
    map.addLayer({
      id: 'variante-postponed-symbols',
      type: 'symbol',
      source: 'variante-postponed-sections',
      paint: {
        'text-halo-color': '#fff',
        'text-halo-width': 4,
      },
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 120,
        'text-font': ['Open Sans Regular'],
        'text-field': ['coalesce', ['get', 'text'], 'variante reportée'],
        'text-size': 14,
      },
    });

    map.on('mouseenter', 'variante-postponed-sections', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'variante-postponed-sections', () => (map.getCanvas().style.cursor = ''));
  }

  function plotPostponedSections({ map, features }: { map: MaplibreType; features: ColoredLineStringFeature[] }) {
    const featuresByColor = groupFeaturesByColor(features);

    for (let line = 1; line <= getNbVoiesCyclables(); line++) {
      const lineColor = getLineColor(line);
      if (!featuresByColor[lineColor]) {
        upsertMapSource(map, `postponed-sections-${lineColor}`, []);
      }
    }

    for (const [color, sameColorFeatures] of Object.entries(featuresByColor)) {
      upsertMapSource(
        map,
        `postponed-sections-${color}`,
        sameColorFeatures as Collections['voiesCyclablesGeojson']['features'],
      );

      if (map.getLayer(`postponed-symbols-${color}`)) {
        continue;
      }

      map.addLayer({
        id: `postponed-symbols-${color}`,
        type: 'symbol',
        source: `postponed-sections-${color}`,
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 1,
          'icon-image': 'cross-icon',
          'icon-size': 1.2,
        },
        paint: {
          'icon-color': color,
        },
      });
      map.addLayer({
        id: `postponed-text-${color}`,
        type: 'symbol',
        source: `postponed-sections-${color}`,
        paint: {
          'text-halo-color': '#fff',
          'text-halo-width': 3,
        },
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 150,
          'text-font': ['Open Sans Regular'],
          'text-field': 'reporté',
          'text-size': 14,
        },
      });
      map.on('mouseenter', `postponed-symbols-${color}`, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', `postponed-symbols-${color}`, () => (map.getCanvas().style.cursor = ''));
    }
  }

  function plotPerspective({
    map,
    features,
  }: {
    map: MaplibreType;
    features: Collections['voiesCyclablesGeojson']['features'];
  }) {
    const perspectives = features.filter(isPerspectiveFeature).map((feature) => ({
      ...feature,
      properties: {
        color: getLineColor(feature.properties.line),
        ...feature.properties,
      },
    }));
    if (perspectives.length === 0) {
      return;
    }

    if (upsertMapSource(map, 'perspectives', perspectives)) {
      return;
    }

    map.addLayer({
      id: 'perspectives',
      source: 'perspectives',
      type: 'symbol',
      minzoom: 14,
      layout: {
        'icon-image': 'camera-icon',
        'icon-size': 0.5,
        'icon-offset': [-25, -25],
      },
      paint: {
        'icon-color': ['get', 'color'],
      },
    });

    // la souris devient un pointer au survol
    map.on('mouseenter', 'perspectives', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'perspectives', () => {
      map.getCanvas().style.cursor = '';
    });
  }

  function plotDangers({
    map,
    features,
  }: {
    map: MaplibreType;
    features: Collections['voiesCyclablesGeojson']['features'];
  }) {
    const dangers = features.filter(isDangerFeature);
    if (dangers.length === 0) {
      return;
    }

    if (upsertMapSource(map, 'dangers', dangers)) {
      return;
    }

    map.addLayer({
      id: 'dangers',
      source: 'dangers',
      type: 'symbol',
      minzoom: 14,
      layout: {
        'icon-image': 'danger-icon',
        'icon-size': 0.7,
      },
    });

    // la souris devient un pointer au survol
    map.on('mousemove', 'dangers', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'dangers', () => {
      map.getCanvas().style.cursor = '';
    });
  }

  function plotCompteurs({ map, features }: { map: MaplibreType; features?: CompteurFeature[] }) {
    const compteurs = (features || [])
      .sort((c1, c2) => (c2.properties.counts.at(-1)?.count ?? 0) - (c1.properties.counts.at(-1)?.count ?? 0))
      .map((c, i) => {
        // top counters are bigger and drawn above others
        const top = 10;
        c.properties.circleSortKey = i < top ? 1 : 0;
        c.properties.circleRadius = i < top ? 10 : 7;
        c.properties.circleStrokeWidth = i < top ? 3 : 0;
        return c;
      });

    upsertMapSource(map, 'compteurs', compteurs);
    if (map.getLayer('compteurs')) {
      return;
    }

    map.addLayer({
      id: 'compteurs',
      source: 'compteurs',
      type: 'circle',
      layout: {
        'circle-sort-key': ['get', 'circleSortKey'],
      },
      paint: {
        'circle-color': '#152B68',
        'circle-stroke-color': '#fff',
        'circle-stroke-width': ['get', 'circleStrokeWidth'],
        'circle-radius': ['get', 'circleRadius'],
      },
    });
    map.on('mouseenter', 'compteurs', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'compteurs', () => (map.getCanvas().style.cursor = ''));
  }

  function getCompteursFeatures({
    counters,
    type,
  }: {
    counters: Collections['compteurs'][] | null;
    type: 'compteur-velo' | 'compteur-voiture' | 'compteur-comparaison';
  }): CompteurFeature[] {
    if (!counters) {
      return [];
    }

    if (counters.length === 0) {
      return [];
    }

    return counters.map((counter) => ({
      type: 'Feature',
      properties: {
        type,
        name: counter.name,
        link: counter.path,
        counts: counter.counts || [],
      },
      geometry: {
        type: 'Point',
        coordinates: [counter.coordinates[0], counter.coordinates[1]],
      },
    }));
  }

  function fitBounds({
    map,
    features,
    padding = 20,
  }: {
    map: MaplibreType;
    features: Array<Collections['voiesCyclablesGeojson']['features'][0] | CompteurFeature>;
    padding?: number | { top: number; bottom: number; left: number; right: number };
  }) {
    const allLineStringsCoordinates: [number, number][] = features
      .filter(isLineStringFeature)
      .flatMap((feature) => feature.geometry.coordinates as [number, number][]);

    const allPointsCoordinates: [number, number][] = features
      .filter(isPointFeature)
      .map((feature) => feature.geometry.coordinates);

    if (allLineStringsCoordinates.length === 0 && allPointsCoordinates.length === 0) {
      return;
    }

    if (features.length === 1 && allPointsCoordinates.length === 1 && allLineStringsCoordinates.length === 0) {
      map.flyTo({ center: allPointsCoordinates[0] as [number, number], zoom: 14, duration: 300 });
    } else {
      const allCoordinates = [...allLineStringsCoordinates, ...allPointsCoordinates];
      const bounds = new LngLatBounds(allCoordinates[0], allCoordinates[0]);
      for (const coord of allCoordinates) {
        bounds.extend(coord);
      }
      map.fitBounds(bounds, { padding, maxZoom: 14 });
    }
  }

  function plotFeatures({
    map,
    features,
  }: {
    map: MaplibreType;
    features: Array<Collections['voiesCyclablesGeojson']['features'][0] | CompteurFeature>;
  }) {
    const lineStringFeatures = features
      .filter(isLineStringFeature)
      .sort(sortByLine)
      .map(addLineColor)
      .map((feature) => {
        const distance = getLineStringDistance(feature);
        return {
          ...feature,
          properties: {
            ...feature.properties,
            distance, // distance in meters
          },
          geometry: {
            ...feature.geometry,
            coordinates: normalizeLineDirection(feature.geometry.coordinates as [number, number][]),
          },
        };
      });

    const processedFeatures = addCompositeIconNames(lineStringFeatures);
    const sections: ColoredLineStringFeature[] = processedFeatures.map((feature, index) => ({
      ...feature,
      id: index,
    })) as unknown as ColoredLineStringFeature[];

    const unsatisfactory: ColoredLineStringFeature[] = [];
    const done: ColoredLineStringFeature[] = [];
    const wip: ColoredLineStringFeature[] = [];
    const planned: ColoredLineStringFeature[] = [];
    const variante: ColoredLineStringFeature[] = [];
    const variantePostponed: ColoredLineStringFeature[] = [];
    const postponed: ColoredLineStringFeature[] = [];

    for (const feature of sections) {
      if (feature.properties.quality === 'unsatisfactory' && feature.properties.status !== 'postponed') {
        unsatisfactory.push(feature);
      }

      switch (feature.properties.status) {
        case 'done':
          done.push(feature);
          break;
        case 'wip':
        case 'tested':
          wip.push(feature);
          break;
        case 'planned':
          planned.push(feature);
          break;
        case 'variante':
          variante.push(feature);
          break;
        case 'variante-postponed':
          variantePostponed.push(feature);
          break;
        case 'postponed':
          postponed.push(feature);
          break;
      }
    }

    plotUnderlinedSections({ map, features: sections });
    plotUnsatisfactorySections({ map, features: unsatisfactory });
    plotDoneSections({ map, features: done });
    plotPlannedSections({ map, features: planned });
    plotVarianteSections({ map, features: variante });
    plotVariantePostponedSections({ map, features: variantePostponed });
    plotWipSections({ map, features: wip });
    plotPostponedSections({ map, features: postponed });

    const compteurFeature = features.filter(isCompteurFeature);
    plotCompteurs({ map, features: compteurFeature });

    const dangerFeatures = features.filter(isDangerFeature);
    plotDangers({ map, features: dangerFeatures });

    const perspectiveFeatures = features.filter(isPerspectiveFeature);
    plotPerspective({ map, features: perspectiveFeatures });
  }

  function createPopup({
    map,
    features,
    event,
    hasDetailsPanel,
    isHover = false,
  }: {
    map: MaplibreType;
    features: Array<Collections['voiesCyclablesGeojson']['features'][0] | CompteurFeature>;
    event: maplibregl.MapMouseEvent;
    hasDetailsPanel: boolean;
    isHover?: boolean;
  }) {
    if (!map) {
      return;
    }

    if (map.getZoom() < 11 && isHover) {
      return;
    }

    const layers = [
      {
        id: 'compteurs',
        isClicked: () => {
          if (!map.getLayer('compteurs')) {
            return false;
          }
          const mapFeature = map.queryRenderedFeatures(event.point, { layers: ['compteurs'] });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(event.point, { layers: ['compteurs'] })[0];
          if (!mapFeature) {
            return;
          }

          const feature = features.find(
            (f) => f.properties.name === mapFeature.properties.name && isCompteurFeature(f),
          );
          return { feature };
        },
        component: CounterTooltip,
        hoverComponent: CounterTooltip,
        getHoverTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(event.point, { layers: ['compteurs'] })[0];

          if (!mapFeature) {
            return;
          }

          const feature = features.find(
            (f) => f.properties.name === mapFeature.properties.name && isCompteurFeature(f),
          );
          return { feature };
        },
      },
      {
        id: 'dangers',
        isClicked: () => {
          if (!map.getLayer('dangers')) {
            return false;
          }
          const mapFeature = map.queryRenderedFeatures(event.point, { layers: ['dangers'] });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(event.point, { layers: ['dangers'] })[0];
          if (!mapFeature) {
            return;
          }

          const feature = features.find((f) => f.properties.name === mapFeature.properties.name);
          return { feature };
        },
        component: DangerTooltip,
      },
      {
        id: 'perspectives',
        isClicked: () => {
          if (!map.getLayer('perspectives')) {
            return false;
          }
          const mapFeature = map.queryRenderedFeatures(event.point, { layers: ['perspectives'] });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(event.point, { layers: ['perspectives'] })[0];
          if (!mapFeature) {
            return;
          }

          const feature = features.find((f) => {
            return (
              f.properties.type === 'perspective' &&
              f.properties.line === mapFeature.properties.line &&
              f.properties.imgUrl === mapFeature.properties.imgUrl
            );
          });

          return { feature };
        },
        component: PerspectiveTooltip,
      },
      {
        id: 'linestring', // not really a layer id. gather all linestrings.
        isClicked: () => {
          const mapFeature = map.queryRenderedFeatures(event.point, {
            filter: [
              'all',
              ['==', ['geometry-type'], 'LineString'],
              ['!=', ['get', 'source'], 'openmaptiles'], // Exclude base map features
              ['has', 'status'], // All sections in geojson LineStrings have a status
            ],
          });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(event.point, {
            filter: [
              'all',
              ['==', ['geometry-type'], 'LineString'],
              ['!=', ['get', 'source'], 'openmaptiles'], // Exclude base map features
              ['has', 'status'], // All sections in geojson LineStrings have a status
            ],
          })[0];

          if (!mapFeature) {
            return;
          }

          const line = mapFeature.properties.line;
          const name = mapFeature.properties.name;

          const lineStringFeatures = features.filter(isLineStringFeature);

          const feature = lineStringFeatures.find((f) => f.properties.line === line && f.properties.name === name);

          if (!feature) {
            return;
          }

          const lines = feature.properties.id
            ? [
                ...new Set(
                  lineStringFeatures
                    .filter((f) => f.properties.id === feature!.properties.id)
                    .map((f) => f.properties.line),
                ),
              ]
            : [feature!.properties.line];

          return { feature, lines, hasDetailsPanel };
        },
        component: window.innerWidth > 1024 ? LineTooltip : LineHoverTooltip,
        getHoverTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(event.point, {
            filter: [
              'all',
              ['==', ['geometry-type'], 'LineString'],
              ['!=', ['get', 'source'], 'openmaptiles'], // Exclude base map features
              ['has', 'status'], // All sections in geojson LineStrings have a status
            ],
          })[0];

          if (!mapFeature) {
            return;
          }

          const line = mapFeature.properties.line;
          const name = mapFeature.properties.name;

          const lineStringFeatures = features.filter(isLineStringFeature);

          const feature = lineStringFeatures.find((f) => f.properties.line === line && f.properties.name === name);

          if (!feature) {
            return;
          }

          const lines = feature.properties.id
            ? [
                ...new Set(
                  lineStringFeatures
                    .filter((f) => f.properties.id === feature!.properties.id)
                    .map((f) => f.properties.line),
                ),
              ]
            : [feature!.properties.line];

          return { feature, lines, hasDetailsPanel };
        },
        hoverComponent: LineHoverTooltip,
      },
    ];

    const clickedLayer = layers.find((layer) => layer.isClicked());
    if (!clickedLayer) {
      if (isHover && currentHoverPopup) {
        currentHoverPopup.remove();
        currentHoverPopup = null;
        lastHoveredFeatureId = null;
      }
      if (!isHover) {
        highlightLines({ map, selections: null });
      }
      return;
    }

    const props = isHover ? clickedLayer.getHoverTooltipProps?.() : clickedLayer.getTooltipProps();
    if (!props) {
      return;
    }

    const featureId = props.feature ? `${clickedLayer.id}-${JSON.stringify(props.feature.properties)}` : null;
    if (isHover) {
      if (featureId === lastClickedFeatureId) {
        return;
      }

      if (featureId === lastHoveredFeatureId && currentHoverPopup) {
        currentHoverPopup.setLngLat(event.lngLat);
        return;
      }
      if (currentHoverPopup) {
        currentHoverPopup.remove();
        currentHoverPopup = null;
      }
      lastHoveredFeatureId = featureId;
    } else {
      lastClickedFeatureId = featureId;
    }

    if (
      !isHover &&
      updateUrlOnFeatureClick &&
      props.feature &&
      !['danger', 'perspective'].includes(props.feature.properties.type) &&
      'name' in props.feature.properties &&
      'line' in props.feature.properties
    ) {
      //@ts-expect-error: todo - fix this
      const link = props.feature?.properties.link;

      const query: LocationQueryRaw = {
        ...route.query,
        line: String(props.feature.properties.line),
        sectionName: props.feature.properties.name,
      };

      const mapFeatures = map.queryRenderedFeatures(event.point, {
        filter: [
          'all',
          ['==', ['geometry-type'], 'LineString'],
          ['!=', ['get', 'source'], 'openmaptiles'], // Exclude base map features
          ['has', 'status'], // All sections in geojson LineStrings have a status
        ],
      });

      const selectedLinesAndSections: Array<{ line: number; sectionName?: string | null }> = [];
      for (const mapFeature of mapFeatures) {
        const line = mapFeature.properties.line;
        selectedLinesAndSections.push({ line: +line, sectionName: mapFeature.properties.name });
      }

      highlightLines({
        map,
        selections: query.line ? selectedLinesAndSections : null,
      });

      if (link) {
        const { line: extractedLine, anchor } = extractLineAndAnchorFromPath(link);
        if (query.modal === 'filters') {
          sessionStorage.setItem('wasFiltersOpen', 'true');
        }

        query.modal = 'details';
        query.line = extractedLine ?? query.line;
        query.sectionAnchor = anchor ?? null;
      }
      void router.replace({ query });
    }

    const tooltipContentId = `${clickedLayer.id}-tooltip-${isHover ? 'hover' : 'click'}-${Date.now()}`;
    const popup = new Popup({
      closeButton: false,
      closeOnClick: !isHover,
      closeOnMove: isHover,
    })
      .setLngLat(event.lngLat)
      // set min dimensions so that the tooltip has some height/width before Vue mounts the component
      // otherwise, if the popup is too close to the top of the map, it is not fully visible
      .setHTML(
        `<div class="transition-all duration-100 ${isHover ? 'delay-100' : ''}"  style="opacity: 0; min-height: 200px; min-width: 100px" id="${tooltipContentId}"></div>`,
      )
      .addTo(map);

    if (isHover) {
      currentHoverPopup = popup;
    } else {
      currentClickPopup = popup;
    }

    popup.on('close', () => {
      if (isHover && currentHoverPopup === popup) {
        currentHoverPopup = null;
        lastHoveredFeatureId = null;
      } else if (!isHover && currentClickPopup === popup) {
        currentClickPopup = null;
        lastClickedFeatureId = null;
      }

      if (isHover) {
        return;
      }

      setTimeout(() => {
        const popups = document.querySelectorAll('.maplibregl-popup');
        if (popups.length === 0) {
          void router.replace({
            query: {
              ...route.query,
              modal:
                updateUrlOnFeatureClick && sessionStorage.getItem('wasFiltersOpen') === 'true' ? 'filters' : undefined,
              line: undefined,
              sectionName: undefined,
            },
          });
        }
      }, 50);
    });

    // @ts-expect-error:next - The component type is dynamically determined and may not match the expected type
    const component = defineComponent(isHover ? clickedLayer.hoverComponent : clickedLayer.component);
    if (!component) {
      return;
    }

    void nextTick(() => {
      createApp({
        render: () =>
          h(Suspense, null, {
            default: h(component, props),
            fallback: 'Chargement...',
          }),
      }).mount(`#${tooltipContentId}`);

      // reset dimensions set initially to position the popup in case the popup content ends up being smaller than the initial min dimensions
      const tooltipContentEl = document.getElementById(tooltipContentId);
      if (tooltipContentEl) {
        tooltipContentEl.style.minHeight = 'initial';
        tooltipContentEl.style.minWidth = 'initial';
        tooltipContentEl.style.opacity = '1';
      }
    });
  }

  function highlightLines({
    map,
    selections,
  }: {
    map: MaplibreType;
    selections: Array<{ line: number; sectionName?: string | null }> | null;
  }) {
    // highlight-layer is used for hover effect only, so we don't need to handle it here
    const layerIds = [
      'done-sections',
      'wip-sections',
      'wip-node-icons',
      'planned-sections',
      'variante-sections',
      'variante-symbols',
      'variante-postponed-sections',
      'variante-postponed-symbols',
      'unsatisfactory-sections',
      'section-names',
      'section-names-low-zoom',
      'section-names-high-zoom',
      'selected-layer',
      'contour-layer',
      'underline-layer',
      'perspectives',
      'dangers',
    ];

    const moveLayerToTop = (layerId: string) => {
      if (map.getLayer(layerId)) {
        map.moveLayer(layerId);
      }
    };

    const { getLineColor } = useColors();
    const { getNbVoiesCyclables } = useConfig();
    const postponedLayerIds: string[] = [];
    for (let line = 1; line <= getNbVoiesCyclables(); line++) {
      const lineColor = getLineColor(line);
      postponedLayerIds.push(`postponed-symbols-${lineColor}`, `postponed-text-${lineColor}`);
    }

    const allLayerIds = [...layerIds, ...postponedLayerIds];

    if (!selections || selections.length === 0) {
      if (wipAnimator) {
        wipAnimator.setSelectedLines(null);
      }
      for (const layerId of allLayerIds) {
        if (!map.getLayer(layerId)) continue;

        const layer = map.getLayer(layerId);
        const layerType = layer?.type;

        if (layerType === 'line') {
          map.setPaintProperty(
            layerId,
            'line-opacity',
            ['variante-sections', 'variante-postponed-sections'].includes(layerId) ? 0.5 : NORMAL_OPACITY,
          );
          if (layerId === 'selected-layer') {
            map.setPaintProperty(layerId, 'line-color', 'rgba(255,255,255,0)');
          }
          if (layerId === 'contour-layer') {
            map.setLayoutProperty(layerId, 'line-cap', 'round');
          }
        } else if (layerType === 'symbol') {
          const filter = map.getFilter(layerId);
          // if the filter is an all expression, remove the isSelectedLineExpression part
          if (filter && Array.isArray(filter) && filter.length > 2 && filter[0] === 'all') {
            map.setFilter(layerId, filter[1]);
          } else if (
            filter &&
            Array.isArray(filter) &&
            filter[0] === 'in' &&
            JSON.stringify(filter[1]) === JSON.stringify(['get', 'line'])
          ) {
            map.setFilter(layerId, null);
          }

          map.setPaintProperty(layerId, 'icon-opacity', NORMAL_OPACITY);
          map.setPaintProperty(layerId, 'text-opacity', NORMAL_OPACITY);
        } else if (layerType === 'circle') {
          map.setPaintProperty(layerId, 'circle-opacity', NORMAL_OPACITY);
          map.setPaintProperty(layerId, 'circle-stroke-opacity', NORMAL_OPACITY);
        }
      }

      const colors = Array.from({ length: getNbVoiesCyclables() }, (_, i) => getLineColor(i + 1)).reverse();

      for (const color of colors) {
        if (!map.getLayer(`postponed-text-${color}`)) {
          continue;
        }
        map.moveLayer(`postponed-symbols-${color}`);
        map.moveLayer(`postponed-text-${color}`);
      }
    } else {
      const selectedLines = [...new Set(selections.map((s) => s.line))];
      if (wipAnimator) {
        wipAnimator.setSelectedLines(selectedLines);
      }
      const isSelectedLineExpression = ['in', ['get', 'line'], ['literal', selectedLines]];

      for (const layerId of allLayerIds) {
        if (!map.getLayer(layerId)) {
          continue;
        }

        const layerType = map.getLayer(layerId)?.type;

        if (layerType === 'line') {
          const currentOpacity = map.getPaintProperty(layerId, 'line-opacity');
          const baseOpacity = typeof currentOpacity === 'number' ? currentOpacity : NORMAL_OPACITY;

          if (layerId === 'selected-layer') {
            const selectionsWithSections = selections.filter((s) => s.sectionName);
            const isSelectedSectionExpression =
              selectionsWithSections.length > 0
                ? [
                    'any',
                    ...selectionsWithSections.map((s) => [
                      'all',
                      ['==', ['get', 'line'], s.line],
                      ['==', ['get', 'name'], s.sectionName],
                    ]),
                  ]
                : null;

            if (isSelectedSectionExpression) {
              map.setPaintProperty(layerId, 'line-opacity', [
                'case',
                isSelectedSectionExpression,
                HIGHLIGHTED_SECTION_OPACITY,
                isSelectedLineExpression,
                baseOpacity,
                DIMMED_OPACITY,
              ]);
              map.setPaintProperty(layerId, 'line-color', ['case', isSelectedSectionExpression, '#665E7B', '#FFFFFF']);
            }
          } else if (layerId === 'contour-layer') {
            map.setLayoutProperty(layerId, 'line-cap', null);
            map.setPaintProperty(layerId, 'line-opacity', [
              'case',
              isSelectedLineExpression,
              HIGHLIGHTED_SECTION_OPACITY,
              ['case', ['has', 'id'], 0.2, 0.4],
            ]);
          } else {
            const hasIdOpacityExpression = ['case', ['has', 'id'], DIMMED_OPACITY / 2, DIMMED_OPACITY];

            map.setPaintProperty(layerId, 'line-opacity', [
              'case',
              isSelectedLineExpression,
              baseOpacity,
              hasIdOpacityExpression,
            ]);
          }
        } else if (layerType === 'symbol') {
          const currentIconOpacity = map.getPaintProperty(layerId, 'icon-opacity');
          const baseIconOpacity = typeof currentIconOpacity === 'number' ? currentIconOpacity : NORMAL_OPACITY;

          const currentTextOpacity = map.getPaintProperty(layerId, 'text-opacity');
          const baseTextOpacity = typeof currentTextOpacity === 'number' ? currentTextOpacity : NORMAL_OPACITY;

          map.setPaintProperty(layerId, 'icon-opacity', ['case', isSelectedLineExpression, baseIconOpacity, 0]);
          map.setPaintProperty(layerId, 'text-opacity', ['case', isSelectedLineExpression, baseTextOpacity, 0]);
        } else if (layerType === 'circle') {
          map.setPaintProperty(layerId, 'circle-opacity', [
            'case',
            isSelectedLineExpression,
            NORMAL_OPACITY,
            DIMMED_OPACITY,
          ]);
          map.setPaintProperty(layerId, 'circle-stroke-opacity', [
            'case',
            isSelectedLineExpression,
            NORMAL_OPACITY,
            DIMMED_OPACITY,
          ]);
        }
      }

      // we need to bring highlighted postponed layers to the front otherwise they are hidden under dimmed layers
      const colors = selectedLines.map((line) => getLineColor(line));

      for (const color of colors.reverse()) {
        if (!map.getLayer(`postponed-text-${color}`)) {
          continue;
        }
        map.moveLayer(`postponed-symbols-${color}`);
        map.moveLayer(`postponed-text-${color}`);
      }
    }

    moveLayerToTop('dangers');
    moveLayerToTop('perspectives');
    moveLayerToTop('section-names');
    moveLayerToTop('section-names-low-zoom');
    moveLayerToTop('section-names-high-zoom');
    moveLayerToTop('compteurs');
  }

  function handleMapClick({
    map,
    features,
    clickEvent,
    hasDetailsPanel,
  }: {
    map: MaplibreType;
    features: Array<Collections['voiesCyclablesGeojson']['features'][0] | CompteurFeature>;
    clickEvent: maplibregl.MapMouseEvent;
    hasDetailsPanel: boolean;
  }) {
    createPopup({ map, features, event: clickEvent, hasDetailsPanel, isHover: false });
  }

  function handleMapHover({
    map,
    features,
    hoverEvent,
    hasDetailsPanel,
  }: {
    map: MaplibreType;
    features: Array<Collections['voiesCyclablesGeojson']['features'][0] | CompteurFeature>;
    hoverEvent: maplibregl.MapMouseEvent;
    hasDetailsPanel: boolean;
  }) {
    createPopup({ map, features, event: hoverEvent, hasDetailsPanel, isHover: true });
  }

  return {
    loadImages,
    plotFeatures,
    getCompteursFeatures,
    fitBounds,
    handleMapClick,
    handleMapHover,
    highlightLines,
  };
};
