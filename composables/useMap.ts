import type { Collections } from '@nuxt/content';
import type maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MaplibreType } from 'maplibre-gl';
import { LngLatBounds, Popup } from 'maplibre-gl';
import { createApp, defineComponent, h, Suspense, watch, onUnmounted } from 'vue';
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
  VARIANTE_OPACITY,
} from '~/helpers/map-utils';
import { type CanvasDashAnimator, createCanvasDashAnimator } from '~/helpers/canvas-animator';

const DIMMED_OPACITY = 0.2;
const NORMAL_OPACITY = 1;
const HIGHLIGHTED_SECTION_OPACITY = 1;
/** rose LVV, couleur du contour des tronçons priorité 2030 */
const PRIORITY_2030_CONTOUR_COLOR = '#C84271';
/** couleur du contour priorité 2030 au survol ou à la sélection */
const PRIORITY_2030_CONTOUR_ACTIVE_COLOR = '#000000';

/** sources sur lesquelles l'état `hover` est propagé (une même section peut être dans plusieurs sources) */
const HOVERABLE_SOURCES = ['all-sections', 'priority-2030-sections'];

/** couches dont les tronçons de variante doivent apparaître en opacité réduite */
const VARIANTE_AWARE_LAYER_IDS = [
  'done-sections',
  'planned-sections',
  'priority-2030-sections',
  'priority-2030-halo',
  'priority-2030-contour',
  'wip-sections',
  'wip-node-icons',
  'wip-shields',
  'unsatisfactory-sections',
];

const isVarianteExpression: maplibregl.ExpressionSpecification = ['boolean', ['get', 'variante'], false];
const isHoveredExpression: maplibregl.ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false];

function isVarianteAwareLayer(layerId: string) {
  return (
    VARIANTE_AWARE_LAYER_IDS.includes(layerId) ||
    layerId.startsWith('postponed-symbols-') ||
    layerId.startsWith('postponed-text-')
  );
}

/**
 * opacité par défaut d'une couche de tronçons : réduite pour les variantes, pleine sinon.
 */
function getBaseOpacity(layerId: string): maplibregl.ExpressionSpecification | number {
  if (!isVarianteAwareLayer(layerId)) {
    return NORMAL_OPACITY;
  }
  return ['case', isVarianteExpression, VARIANTE_OPACITY, NORMAL_OPACITY];
}

/** largeur du halo priorité 2030, également utilisée comme écartement de son contour */
const PRIORITY_2030_HALO_WIDTH: maplibregl.ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  11,
  4,
  14,
  15,
];

function getPriority2030HaloOpacity(
  mapOpacity: (opacity: number) => unknown = (opacity) => opacity,
): maplibregl.ExpressionSpecification {
  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    11,
    mapOpacity(0.5),
    14,
    mapOpacity(0.35),
  ] as maplibregl.ExpressionSpecification;
}

/**
 * contour rose LVV des tronçons priorité 2030, qui passe au noir au survol ou à la sélection.
 */
function getPriority2030ContourColor(
  isSelectedExpression?: maplibregl.ExpressionSpecification,
): maplibregl.ExpressionSpecification {
  if (!isSelectedExpression) {
    return [
      'case',
      isHoveredExpression,
      PRIORITY_2030_CONTOUR_ACTIVE_COLOR,
      PRIORITY_2030_CONTOUR_COLOR,
    ] as maplibregl.ExpressionSpecification;
  }

  return [
    'case',
    isHoveredExpression,
    PRIORITY_2030_CONTOUR_ACTIVE_COLOR,
    isSelectedExpression,
    PRIORITY_2030_CONTOUR_ACTIVE_COLOR,
    PRIORITY_2030_CONTOUR_COLOR,
  ] as maplibregl.ExpressionSpecification;
}

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
  let popupCloseHandledByMapClick = false;
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
        'line-opacity': getBaseOpacity('unsatisfactory-sections'),
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

    // une même section est présente dans plusieurs sources (all-sections + la source de son statut),
    // il faut donc propager l'état de survol à chacune d'elles
    const setHoverState = (id: string | number, hover: boolean) => {
      for (const source of HOVERABLE_SOURCES) {
        if (map.getSource(source)) {
          map.setFeatureState({ source, id }, { hover });
        }
      }
    };

    map.on('mousemove', 'highlight-layer', (e: maplibregl.MapMouseEvent) => {
      map.getCanvas().style.cursor = 'pointer';
      const features = map.queryRenderedFeatures(e.point, { layers: ['highlight-layer'] });
      if (features.length > 0) {
        if (hoveredLineId !== null) {
          setHoverState(hoveredLineId, false);
        }
        if (features[0]?.id !== undefined) {
          hoveredLineId = features[0].id;
          if (hoveredLineId !== null) {
            setHoverState(hoveredLineId, true);
          }
        }
      }
    });
    map.on('mouseleave', 'highlight-layer', () => {
      map.getCanvas().style.cursor = '';
      if (hoveredLineId !== null) {
        setHoverState(hoveredLineId, false);
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
        'line-opacity': getBaseOpacity('done-sections'),
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
      layout: {
        visibility: reduceMotion.value ? 'visible' : 'none',
      },
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color'],
        'line-dasharray': [2, 2],
        'line-opacity': getBaseOpacity('wip-sections'),
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
        currentMap.setLayoutProperty('wip-sections', 'visibility', visibility);
      }

      if (wipAnimator) {
        wipAnimator.setVisible(!shouldReduce);
      }
    },
    { immediate: true },
  );

  onUnmounted(() => {
    if (wipAnimator) {
      wipAnimator.destroy();
    }
  });

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
        'line-opacity': getBaseOpacity('planned-sections'),
      },
    });
  }

  function plotPriority2030Sections({ map, features }: { map: MaplibreType; features: ColoredLineStringFeature[] }) {
    if (features.length === 0 && !map.getLayer('priority-2030-sections')) {
      return;
    }
    if (upsertMapSource(map, 'priority-2030-sections', features as Collections['voiesCyclablesGeojson']['features'])) {
      return;
    }

    map.addLayer({
      id: 'priority-2030-halo',
      type: 'line',
      source: 'priority-2030-sections',
      layout: {
        'line-cap': 'round',
      },
      paint: {
        'line-width': PRIORITY_2030_HALO_WIDTH,
        'line-color': ['get', 'color'],
        'line-opacity': getPriority2030HaloOpacity(),
      },
    });
    // contour rose LVV du halo, lisible à tous les niveaux de zoom
    map.addLayer({
      id: 'priority-2030-contour',
      type: 'line',
      source: 'priority-2030-sections',
      layout: {
        'line-cap': 'round',
      },
      paint: {
        'line-gap-width': PRIORITY_2030_HALO_WIDTH,
        'line-width': 2,
        'line-color': getPriority2030ContourColor(),
        'line-opacity': getBaseOpacity('priority-2030-contour'),
      },
    });
    map.addLayer({
      id: 'priority-2030-sections',
      type: 'line',
      source: 'priority-2030-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color'],
        'line-dasharray': [2, 4],
        'line-opacity': getBaseOpacity('priority-2030-sections'),
      },
    });
  }

  /**
   * affiche le libellé `text` le long des tronçons qui en déclarent un, quel que soit leur statut
   * (sert notamment à nommer les variantes du réseau 2030).
   */
  function plotSectionTexts({ map, features }: { map: MaplibreType; features: ColoredLineStringFeature[] }) {
    const featuresWithText = features.filter((feature) => Boolean(feature.properties.text));
    if (featuresWithText.length === 0 && !map.getLayer('section-texts')) {
      return;
    }
    if (
      upsertMapSource(map, 'sections-with-text', featuresWithText as Collections['voiesCyclablesGeojson']['features'])
    ) {
      return;
    }

    map.addLayer({
      id: 'section-texts',
      type: 'symbol',
      source: 'sections-with-text',
      paint: {
        'text-halo-color': '#fff',
        'text-halo-width': 4,
      },
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 120,
        'text-font': ['Open Sans Regular'],
        'text-field': ['get', 'text'],
        'text-size': 14,
      },
    });
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
          'icon-opacity': getBaseOpacity(`postponed-symbols-${color}`),
        },
      });
      map.addLayer({
        id: `postponed-text-${color}`,
        type: 'symbol',
        source: `postponed-sections-${color}`,
        // les tronçons qui portent un libellé propre sont étiquetés par la couche `section-texts`
        filter: ['!', ['has', 'text']],
        paint: {
          'text-halo-color': '#fff',
          'text-halo-width': 3,
          'text-opacity': getBaseOpacity(`postponed-text-${color}`),
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

  function createBicolorCircleIcon(size: number, strokeWidth: number): HTMLCanvasElement {
    const scale = 2;
    const canvas = document.createElement('canvas');
    const totalSize = (size + strokeWidth) * 2 * scale;
    canvas.width = totalSize;
    canvas.height = totalSize;
    const ctx = canvas.getContext('2d')!;
    const cx = totalSize / 2;
    const cy = totalSize / 2;
    const r = size * scale;

    if (strokeWidth > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + strokeWidth * scale * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * 1.5, cy - r * 1.5);
    ctx.lineTo(cx - r * 1.5, cy - r * 1.5);
    ctx.lineTo(cx - r * 1.5, cy + r * 1.5);
    ctx.closePath();
    ctx.clip();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#C84271';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * 1.5, cy - r * 1.5);
    ctx.lineTo(cx + r * 1.5, cy + r * 1.5);
    ctx.lineTo(cx - r * 1.5, cy + r * 1.5);
    ctx.closePath();
    ctx.clip();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#152B68';
    ctx.fill();
    ctx.restore();

    return canvas;
  }

  function plotCompteurs({ map, features }: { map: MaplibreType; features?: CompteurFeature[] }) {
    const compteurs = (features || [])
      .sort((c1, c2) => {
        const last1 = c1.properties.counts.at(-1);
        const last2 = c2.properties.counts.at(-1);
        const v1 = last1 && 'count' in last1 ? last1.count : 0;
        const v2 = last2 && 'count' in last2 ? last2.count : 0;
        return v2 - v1;
      })
      .map((c, i) => {
        const top = 10;
        c.properties.circleSortKey = i < top ? 1 : 0;
        c.properties.circleRadius = i < top ? 10 : 7;
        c.properties.circleStrokeWidth = i < top ? 3 : 2;
        return c;
      });

    const regularCompteurs = compteurs.filter((c) => !c.properties.isMixed);
    const mixedCompteurs = compteurs.filter((c) => c.properties.isMixed);

    upsertMapSource(map, 'compteurs', regularCompteurs);
    if (!map.getLayer('compteurs')) {
      map.addLayer({
        id: 'compteurs',
        source: 'compteurs',
        type: 'circle',
        layout: {
          'circle-sort-key': ['get', 'circleSortKey'],
        },
        paint: {
          'circle-color': [
            'match',
            ['get', 'type'],
            'compteur-velo',
            '#C84271',
            'compteur-voiture',
            '#152B68',
            '#152B68',
          ],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': ['get', 'circleStrokeWidth'],
          'circle-radius': ['get', 'circleRadius'],
        },
      });
      map.on('mouseenter', 'compteurs', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'compteurs', () => (map.getCanvas().style.cursor = ''));

      map.addLayer({
        id: 'compteurs-labels',
        source: 'compteurs',
        type: 'symbol',
        minzoom: 13,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-max-width': 10,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#333',
          'text-halo-color': '#fff',
          'text-halo-width': 1.5,
        },
      });
    }

    if (mixedCompteurs.length > 0) {
      const sizes = [
        { name: 'bicolor-circle-large', radius: 10, stroke: 3 },
        { name: 'bicolor-circle-small', radius: 7, stroke: 2 },
      ];
      for (const { name, radius, stroke } of sizes) {
        if (!map.hasImage(name)) {
          const canvas = createBicolorCircleIcon(radius, stroke);
          const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
          if (imageData) {
            map.addImage(name, imageData, { sdf: false });
          }
        }
      }
    }

    if (mixedCompteurs.length > 0 || map.getSource('compteurs-mixed')) {
      upsertMapSource(map, 'compteurs-mixed', mixedCompteurs);
      if (!map.getLayer('compteurs-mixed') && mixedCompteurs.length > 0) {
        map.addLayer({
          id: 'compteurs-mixed',
          source: 'compteurs-mixed',
          type: 'symbol',
          layout: {
            'icon-image': ['case', ['==', ['get', 'circleRadius'], 10], 'bicolor-circle-large', 'bicolor-circle-small'],
            'icon-size': 0.5,
            'icon-allow-overlap': true,
            'symbol-sort-key': ['get', 'circleSortKey'],
          },
        });
        map.on('mouseenter', 'compteurs-mixed', () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', 'compteurs-mixed', () => (map.getCanvas().style.cursor = ''));

        map.addLayer({
          id: 'compteurs-mixed-labels',
          source: 'compteurs-mixed',
          type: 'symbol',
          minzoom: 13,
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 11,
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
            'text-max-width': 10,
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#333',
            'text-halo-color': '#fff',
            'text-halo-width': 1.5,
          },
        });
      }
    }
  }

  function getCompteursFeatures({
    counters,
    type,
    isMixed = false,
  }: {
    counters: Collections['compteurs'][] | null;
    type: 'compteur-velo' | 'compteur-voiture' | 'compteur-comparaison';
    isMixed?: boolean;
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
        isMixed,
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
    const priority2030: ColoredLineStringFeature[] = [];
    const postponed: ColoredLineStringFeature[] = [];

    for (const feature of sections) {
      if (
        feature.properties.quality === 'unsatisfactory' &&
        feature.properties.status !== 'postponed' &&
        feature.properties.status !== 'priority-2030'
      ) {
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
        case 'priority-2030':
          priority2030.push(feature);
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
    plotPriority2030Sections({ map, features: priority2030 });
    plotWipSections({ map, features: wip });
    plotPostponedSections({ map, features: postponed });
    plotSectionTexts({ map, features: sections });

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
        id: 'compteurs-mixed',
        isClicked: () => {
          if (!map.getLayer('compteurs-mixed')) {
            return false;
          }
          const mapFeature = map.queryRenderedFeatures(event.point, { layers: ['compteurs-mixed'] });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(event.point, { layers: ['compteurs-mixed'] })[0];
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
          const mapFeature = map.queryRenderedFeatures(event.point, { layers: ['compteurs-mixed'] })[0];

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
        hoverComponent: DangerTooltip,
        getHoverTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(event.point, { layers: ['dangers'] })[0];
          if (!mapFeature) {
            return;
          }

          const feature = features.find((f) => f.properties.name === mapFeature.properties.name);
          return { feature };
        },
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
        hoverComponent: PerspectiveTooltip,
        getHoverTooltipProps: () => {
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
        popupCloseHandledByMapClick = true;
        if (currentClickPopup) {
          currentClickPopup.remove();
          currentClickPopup = null;
          lastClickedFeatureId = null;
        }
        highlightLines({ map, selections: null });
        highlightCounter({ map, counterName: null });
        if (updateUrlOnFeatureClick && (route.query.modal === 'counter' || route.query.modal === 'details')) {
          const restoreFilters = route.query.modal === 'counter' || sessionStorage.getItem('wasFiltersOpen') === 'true';
          void router.replace({
            query: {
              ...route.query,
              modal: restoreFilters ? 'filters' : undefined,
              line: undefined,
              sectionName: undefined,
              sectionAnchor: undefined,
              counterLink: undefined,
            },
          });
        }
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

    if (
      !isHover &&
      updateUrlOnFeatureClick &&
      props.feature &&
      isCompteurFeature(props.feature) &&
      props.feature.properties.link
    ) {
      highlightCounter({ map, counterName: props.feature.properties.name });
      const query: LocationQueryRaw = {
        ...route.query,
        modal: 'counter',
        counters: '1',
        counterLink: props.feature.properties.link,
      };
      if (route.query.modal === 'filters') {
        sessionStorage.setItem('wasFiltersOpen', 'true');
      }
      delete query.line;
      delete query.sectionName;
      delete query.sectionAnchor;
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
        if (popupCloseHandledByMapClick) {
          popupCloseHandledByMapClick = false;
          return;
        }

        if (currentClickPopup) {
          return;
        }

        const popups = document.querySelectorAll('.maplibregl-popup');
        if (popups.length === 0) {
          if (currentMap) {
            highlightCounter({ map: currentMap, counterName: null });
          }
          const restoreFilters =
            updateUrlOnFeatureClick &&
            (route.query.modal === 'counter' || sessionStorage.getItem('wasFiltersOpen') === 'true');
          void router.replace({
            query: {
              ...route.query,
              modal: restoreFilters ? 'filters' : undefined,
              line: undefined,
              sectionName: undefined,
              counterLink: undefined,
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
      'priority-2030-halo',
      'priority-2030-contour',
      'priority-2030-sections',
      'unsatisfactory-sections',
      'section-texts',
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
          if (layerId === 'priority-2030-halo') {
            map.setPaintProperty(layerId, 'line-opacity', getPriority2030HaloOpacity());
          } else {
            map.setPaintProperty(layerId, 'line-opacity', getBaseOpacity(layerId));
          }
          if (layerId === 'selected-layer') {
            map.setPaintProperty(layerId, 'line-color', 'rgba(255,255,255,0)');
          }
          if (layerId === 'priority-2030-contour') {
            map.setPaintProperty(layerId, 'line-color', getPriority2030ContourColor());
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

          map.setPaintProperty(layerId, 'icon-opacity', getBaseOpacity(layerId));
          map.setPaintProperty(layerId, 'text-opacity', getBaseOpacity(layerId));
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
          const baseOpacity = getBaseOpacity(layerId);

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
          } else if (layerId === 'priority-2030-halo') {
            const hasIdOpacityExpression = ['case', ['has', 'id'], DIMMED_OPACITY / 2, DIMMED_OPACITY];

            map.setPaintProperty(
              layerId,
              'line-opacity',
              getPriority2030HaloOpacity((opacity) => [
                'case',
                isSelectedLineExpression,
                opacity,
                hasIdOpacityExpression,
              ]),
            );
          } else {
            const hasIdOpacityExpression = ['case', ['has', 'id'], DIMMED_OPACITY / 2, DIMMED_OPACITY];

            map.setPaintProperty(layerId, 'line-opacity', [
              'case',
              isSelectedLineExpression,
              baseOpacity,
              hasIdOpacityExpression,
            ]);
          }

          if (layerId === 'priority-2030-contour') {
            map.setPaintProperty(
              layerId,
              'line-color',
              getPriority2030ContourColor(isSelectedLineExpression as maplibregl.ExpressionSpecification),
            );
          }
        } else if (layerType === 'symbol') {
          const baseSymbolOpacity = getBaseOpacity(layerId);

          map.setPaintProperty(layerId, 'icon-opacity', ['case', isSelectedLineExpression, baseSymbolOpacity, 0]);
          map.setPaintProperty(layerId, 'text-opacity', ['case', isSelectedLineExpression, baseSymbolOpacity, 0]);
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

    moveLayerToTop('section-texts');
    moveLayerToTop('dangers');
    moveLayerToTop('perspectives');
    moveLayerToTop('section-names');
    moveLayerToTop('section-names-low-zoom');
    moveLayerToTop('section-names-high-zoom');
    moveLayerToTop('compteurs');
    moveLayerToTop('compteurs-labels');
    moveLayerToTop('compteurs-mixed');
    moveLayerToTop('compteurs-mixed-labels');
  }

  function highlightCounter({ map, counterName }: { map: MaplibreType; counterName: string | null }) {
    if (map.getLayer('compteurs')) {
      if (counterName) {
        map.setPaintProperty('compteurs', 'circle-radius', [
          'case',
          ['==', ['get', 'name'], counterName],
          14,
          ['get', 'circleRadius'],
        ]);
        map.setPaintProperty('compteurs', 'circle-stroke-width', [
          'case',
          ['==', ['get', 'name'], counterName],
          4,
          ['get', 'circleStrokeWidth'],
        ]);
        map.setPaintProperty('compteurs', 'circle-stroke-color', [
          'case',
          ['==', ['get', 'name'], counterName],
          '#FFD700',
          '#fff',
        ]);
      } else {
        map.setPaintProperty('compteurs', 'circle-radius', ['get', 'circleRadius']);
        map.setPaintProperty('compteurs', 'circle-stroke-width', ['get', 'circleStrokeWidth']);
        map.setPaintProperty('compteurs', 'circle-stroke-color', '#fff');
      }
    }

    if (map.getSource('compteurs-mixed')) {
      if (!map.getLayer('compteurs-mixed-highlight')) {
        map.addLayer(
          {
            id: 'compteurs-mixed-highlight',
            source: 'compteurs-mixed',
            type: 'circle',
            filter: ['==', ['get', 'name'], ''],
            paint: {
              'circle-radius': 16,
              'circle-color': 'transparent',
              'circle-stroke-color': '#FFD700',
              'circle-stroke-width': 4,
            },
          },
          'compteurs-mixed',
        );
      }

      if (counterName) {
        map.setFilter('compteurs-mixed-highlight', ['==', ['get', 'name'], counterName]);
        if (map.getLayer('compteurs-mixed')) {
          map.setLayoutProperty('compteurs-mixed', 'icon-size', [
            'case',
            ['==', ['get', 'name'], counterName],
            0.75,
            0.5,
          ]);
        }
      } else {
        map.setFilter('compteurs-mixed-highlight', ['==', ['get', 'name'], '']);
        if (map.getLayer('compteurs-mixed')) {
          map.setLayoutProperty('compteurs-mixed', 'icon-size', 0.5);
        }
      }
    }
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

  function showFeatureTooltip({
    map,
    feature,
    allFeatures,
    hasDetailsPanel,
  }: {
    map: MaplibreType;
    feature: Collections['voiesCyclablesGeojson']['features'][0];
    allFeatures: Array<Collections['voiesCyclablesGeojson']['features'][0] | CompteurFeature>;
    hasDetailsPanel: boolean;
  }) {
    if (feature.geometry.type !== 'LineString') {
      return;
    }

    if (currentClickPopup) {
      currentClickPopup.remove();
      currentClickPopup = null;
    }

    const lineStringFeatures = allFeatures.filter(isLineStringFeature);
    const lines = feature.properties.id
      ? [
          ...new Set(
            lineStringFeatures.filter((f) => f.properties.id === feature.properties.id).map((f) => f.properties.line),
          ),
        ]
      : [feature.properties.line];

    const coords = feature.geometry.coordinates;
    const midCoord = coords[Math.floor(coords.length / 2)] as [number, number];

    const tooltipContentId = `search-tooltip-${Date.now()}`;
    const popup = new Popup({ closeButton: false, closeOnClick: true })
      .setLngLat(midCoord)
      .setHTML(`<div style="opacity: 0; min-height: 200px; min-width: 100px" id="${tooltipContentId}"></div>`)
      .addTo(map);

    currentClickPopup = popup;
    lastClickedFeatureId = `search-${feature.properties.name}`;

    const component = defineComponent(window.innerWidth > 1024 ? LineTooltip : LineHoverTooltip);

    void nextTick(() => {
      createApp({
        render: () =>
          h(Suspense, null, {
            default: h(component, { feature, lines, hasDetailsPanel }),
            fallback: 'Chargement...',
          }),
      }).mount(`#${tooltipContentId}`);

      const el = document.getElementById(tooltipContentId);
      if (el) {
        el.style.minHeight = 'initial';
        el.style.minWidth = 'initial';
        el.style.opacity = '1';
      }
    });
  }

  return {
    loadImages,
    plotFeatures,
    getCompteursFeatures,
    fitBounds,
    handleMapClick,
    handleMapHover,
    highlightLines,
    highlightCounter,
    showFeatureTooltip,
  };
};
