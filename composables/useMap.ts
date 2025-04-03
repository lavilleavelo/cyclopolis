import { GeoJSONSource, LngLatBounds, Map, Popup } from 'maplibre-gl';
import { createApp, defineComponent, h, Suspense } from 'vue';
import type { CounterParsedContent } from '../types/counters';
import { isCompteurFeature, isDangerFeature, isPumpFeature, isLineStringFeature, isPerspectiveFeature, isPointFeature, type Feature, type LineStringFeature, type CompteurFeature } from '~/types';

// Tooltips
import PerspectiveTooltip from '~/components/tooltips/PerspectiveTooltip.vue';
import CounterTooltip from '~/components/tooltips/CounterTooltip.vue';
import DangerTooltip from '~/components/tooltips/DangerTooltip.vue';
import LineTooltip from '~/components/tooltips/LineTooltip.vue';

type ColoredLineStringFeature = LineStringFeature & { properties: { color: string } };
const { getNbVoiesCyclables } = useConfig();

// features plotted last are on top
const sortOrder = [1, 3, 2, 4, 5, 6, 7, 12, 8, 9, 10, 11].reverse();

function sortByLine(featureA: LineStringFeature, featureB: LineStringFeature) {
  const lineA = featureA.properties.line;
  const lineB = featureB.properties.line;
  return sortOrder.indexOf(lineA) - sortOrder.indexOf(lineB);
}

function getCrossIconUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 8; // Set the desired width of your icon
  canvas.height = 8; // Set the desired height of your icon
  const context = canvas.getContext('2d');
  if (!context) {
    return '';
  }

  // Draw the first diagonal line of the "X"
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(canvas.width, canvas.height);
  context.lineWidth = 3;
  context.stroke();

  // Draw the second diagonal line of the "X"
  context.beginPath();
  context.moveTo(0, canvas.height);
  context.lineTo(canvas.width, 0);
  context.lineWidth = 3;
  context.stroke();

  return canvas.toDataURL();
}

function groupFeaturesByColor(features: ColoredLineStringFeature[]) {
  const featuresByColor: Record<string, Feature[]> = {};
  for (const feature of features) {
    const color = feature.properties.color;

    if (featuresByColor[color]) {
      featuresByColor[color].push(feature);
    } else {
      featuresByColor[color] = [feature];
    }
  }
  return featuresByColor;
}

export const useMap = () => {
  const { getLineColor } = useColors();

  function addLineColor(feature: LineStringFeature): ColoredLineStringFeature {
    return {
      ...feature,
      properties: {
        color: getLineColor(feature.properties.line),
        ...feature.properties
      }
    };
  }

  function upsertMapSource(map: Map, sourceName: string, features: Feature[]) {
    const source = map.getSource(sourceName) as GeoJSONSource;
    if (source) {
      source.setData({ type: 'FeatureCollection', features });
      return true;
    }
    map.addSource(sourceName, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features }
    });
    return false;
  }

  async function loadImages({ map }: { map: Map }) {
    const camera = await map.loadImage('/icons/camera.png');
    map.addImage('camera-icon', camera.data, { sdf: true });

    const pump = await map.loadImage('/icons/pump.png');
    map.addImage('pump-icon', pump.data, { sdf: true });

    const danger = await map.loadImage('/icons/danger.png');
    map.addImage('danger-icon', danger.data, { sdf: false });

    const crossIconUrl = getCrossIconUrl();
    const cross = await map.loadImage(crossIconUrl);
    map.addImage('cross-icon', cross.data, { sdf: true });
  }

  function plotUnsatisfactorySections({ map, features }: { map: Map; features: LineStringFeature[] }) {
    const sections = features.filter(feature => feature.properties.quality === 'unsatisfactory' && feature.properties.status !== 'postponed');

    if (sections.length === 0 && !map.getLayer('unsatisfactory-sections')) {
      return;
    }
    if (upsertMapSource(map, 'unsatisfactory-sections', sections)) {
      return;
    }

    map.addLayer({
      id: 'unsatisfactory-sections',
      type: 'line',
      source: 'unsatisfactory-sections',
      minzoom: 14,
      paint: {
        'line-gap-width': 5,
        'line-width': 4,
        'line-color': '#c84271',
        'line-dasharray': [0.8, 0.8]
      }
    });
  }

  function plotUnderlinedSections({ map, features }: { map: Map; features: LineStringFeature[] }) {
    const sections = features.map((feature, index) => ({ id: index, ...feature }));

    if (sections.length === 0 && !map.getLayer('highlight')) {
      return;
    }
    if (upsertMapSource(map, 'all-sections', sections)) {
      return;
    }

    map.addLayer({
      id: 'highlight',
      type: 'line',
      source: 'all-sections',
      layout: { 'line-cap': 'round' },
      paint: {
        'line-gap-width': 5,
        'line-width': 4,
        'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#9ca3af', '#FFFFFF']
      }
    });
    map.addLayer({
      id: 'contour',
      type: 'line',
      source: 'all-sections',
      layout: { 'line-cap': 'round' },
      paint: {
        'line-gap-width': 4,
        'line-width': 1,
        'line-color': '#6b7280'
      }
    });
    map.addLayer({
      id: 'underline',
      type: 'line',
      source: 'all-sections',
      paint: {
        'line-width': 4,
        'line-color': '#ffffff'
      }
    });

    let hoveredLineId: any = null;
    map.on('mousemove', 'highlight', (e: any) => {
      map.getCanvas().style.cursor = 'pointer';
      if (e.features.length > 0) {
        if (hoveredLineId !== null) {
          map.setFeatureState({ source: 'all-sections', id: hoveredLineId }, { hover: false });
        }
        if (e.features[0].id !== undefined) {
          hoveredLineId = e.features[0].id;
          if (hoveredLineId !== null) {
            map.setFeatureState({ source: 'all-sections', id: hoveredLineId }, { hover: true });
          }
        }
      }
    });
    map.on('mouseleave', 'highlight', () => {
      map.getCanvas().style.cursor = '';
      if (hoveredLineId !== null) {
        map.setFeatureState({ source: 'all-sections', id: hoveredLineId }, { hover: false });
      }
      hoveredLineId = null;
    });
  }

  function plotDoneSections({ map, features }: { map: Map; features: ColoredLineStringFeature[] }) {
    const sections = features.filter(feature => feature.properties.status === 'done');

    // si il n'y a rien a afficher et que la couche n'existe pas, on ne fait rien
    // si elle existe déjà, on la maj (carte dynamique par année)
    if (sections.length === 0 && !map.getLayer('done-sections')) {
      return;
    }
    if (upsertMapSource(map, 'done-sections', sections)) {
      return;
    }

    map.addLayer({
      id: 'done-sections',
      type: 'line',
      source: 'done-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color']
      }
    });
  }

  function plotWipSections({ map, features }: { map: Map; features: ColoredLineStringFeature[] }) {
    const sections = features.filter(feature => {
      // on considère les sections en test comme en travaux
      return feature.properties.status === 'wip' || feature.properties.status === 'tested';
    });

    if (sections.length === 0 && !map.getLayer('wip-sections')) {
      return;
    }
    if (upsertMapSource(map, 'wip-sections', sections)) {
      return;
    }

    map.addLayer({
      id: 'wip-sections',
      type: 'line',
      source: 'wip-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color'],
        'line-dasharray': [0, 2, 2]
      }
    });

    const dashArraySequence = [
      [0, 2, 2],
      [0.5, 2, 1.5],
      [1, 2, 1],
      [1.5, 2, 0.5],
      [2, 2, 0],
      [0, 0.5, 2, 1.5],
      [0, 1, 2, 1],
      [0, 1.5, 2, 0.5]
    ];
    let step = 0;
    function animateDashArray(timestamp: number) {
      // Update line-dasharray using the next value in dashArraySequence. The
      // divisor in the expression `timestamp / 45` controls the animation speed.
      const newStep = Math.floor((timestamp / 45) % dashArraySequence.length);

      if (newStep !== step) {
        map.setPaintProperty('wip-sections', 'line-dasharray', dashArraySequence[step]);
        step = newStep;
      }

      // Request the next frame of the animation.
      requestAnimationFrame(animateDashArray);
    }
    animateDashArray(0);
  }

  function plotPlannedSections({ map, features }: { map: Map; features: ColoredLineStringFeature[] }) {
    const sections = features.filter(feature => feature.properties.status === 'planned');

    if (sections.length === 0 && !map.getLayer('planned-sections')) {
      return;
    }
    if (upsertMapSource(map, 'planned-sections', sections)) {
      return;
    }

    map.addLayer({
      id: 'planned-sections',
      type: 'line',
      source: 'planned-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color'],
        'line-dasharray': [2, 2]
      }
    });
  }

  function plotVarianteSections({ map, features }: { map: Map; features: ColoredLineStringFeature[] }) {
    const sections = features.filter(feature => feature.properties.status === 'variante');

    if (sections.length === 0 && !map.getLayer('variante-sections')) {
      return;
    }
    if (upsertMapSource(map, 'variante-sections', sections)) {
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
        'line-opacity': 0.5
      }
    });
    map.addLayer({
      id: 'variante-symbols',
      type: 'symbol',
      source: 'variante-sections',
      paint: {
        'text-halo-color': '#fff',
        'text-halo-width': 4
      },
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 120,
        'text-font': ['Open Sans Regular'],
        'text-field': ['coalesce', ['get', 'text'], 'variante'],
        'text-size': 14
      }
    });

    map.on('mouseenter', 'variante-sections', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'variante-sections', () => (map.getCanvas().style.cursor = ''));
  }

  function plotVariantePostponedSections({ map, features }: { map: Map; features: ColoredLineStringFeature[] }) {
    const sections = features.filter(feature => feature.properties.status === 'variante-postponed');

    if (sections.length === 0 && !map.getLayer('variante-postponed-sections')) {
      return;
    }
    if (upsertMapSource(map, 'variante-postponed-sections', sections)) {
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
        'line-opacity': 0.5
      }
    });
    map.addLayer({
      id: 'variante-postponed-symbols',
      type: 'symbol',
      source: 'variante-postponed-sections',
      paint: {
        'text-halo-color': '#fff',
        'text-halo-width': 4
      },
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 120,
        'text-font': ['Open Sans Regular'],
        'text-field': ['coalesce', ['get', 'text'], 'variante reportée'],
        'text-size': 14
      }
    });

    map.on('mouseenter', 'variante-postponed-sections', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'variante-postponed-sections', () => (map.getCanvas().style.cursor = ''));
  }

  function plotUnknownSections({ map, features }: { map: Map; features: ColoredLineStringFeature[] }) {
    const sections = features.filter(feature => feature.properties.status === 'unknown');

    if (sections.length === 0 && !map.getLayer('unknown-sections')) {
      return;
    }
    if (upsertMapSource(map, 'unknown-sections', sections)) {
      return;
    }

    map.addLayer({
      id: 'unknown-sections',
      type: 'line',
      source: 'unknown-sections',
      layout: {
        'line-cap': 'round'
      },
      paint: {
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          11,
          4, // width 4 at low zoom
          14,
          25 // progressively reach width 25 at high zoom
        ],
        'line-color': ['get', 'color'],
        'line-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          11,
          0.5, // opacity 0.4 at low zoom
          14,
          0.35 // opacity 0.35 at high zoom
        ]
      }
    });
    map.addLayer({
      id: 'unknown-symbols',
      type: 'symbol',
      source: 'unknown-sections',
      paint: {
        'text-halo-color': '#fff',
        'text-halo-width': 3
      },
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 120,
        'text-font': ['Open Sans Regular'],
        'text-field': 'tracé à définir',
        'text-size': 14
      }
    });

    map.on('mouseenter', 'unknown-sections', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'unknown-sections', () => (map.getCanvas().style.cursor = ''));
  }

  function plotPostponedSections({ map, features }: { map: Map; features: ColoredLineStringFeature[] }) {
    const sections = features.filter(feature => feature.properties.status === 'postponed');

    if (sections.length === 0) {
      for (let line = 1; line <= getNbVoiesCyclables(); line++) {
        upsertMapSource(map, `postponed-sections-${getLineColor(line)}`, []);
      }
      return;
    }

    const featuresByColor = groupFeaturesByColor(sections);
    for (const [color, sameColorFeatures] of Object.entries(featuresByColor)) {
      if (upsertMapSource(map, `postponed-sections-${color}`, sameColorFeatures as Feature[])) {
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
          'icon-size': 1.2
        },
        paint: {
          'icon-color': color
        }
      });
      map.addLayer({
        id: `postponed-text-${color}`,
        type: 'symbol',
        source: `postponed-sections-${color}`,
        paint: {
          'text-halo-color': '#fff',
          'text-halo-width': 3
        },
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 150,
          'text-font': ['Open Sans Regular'],
          'text-field': 'reporté',
          'text-size': 14
        }
      });

      map.on('mouseenter', `postponed-symbols-${color}`, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', `postponed-symbols-${color}`, () => (map.getCanvas().style.cursor = ''));
    }
  }

  function plotPerspective({ map, features }: { map: Map; features: Feature[] }) {
    const perspectives = features.filter(isPerspectiveFeature).map(feature => ({
      ...feature,
      properties: {
        color: getLineColor(feature.properties.line),
        ...feature.properties
      }
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
        'icon-offset': [-25, -25]
      },
      paint: {
        'icon-color': ['get', 'color']
      }
    });

    // la souris devient un pointer au survol
    map.on('mouseenter', 'perspectives', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'perspectives', () => {
      map.getCanvas().style.cursor = '';
    });
  }

  function plotDangers({ map, features }: { map: Map; features: Feature[] }) {
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
        'icon-size': 0.7
      }
    });

    // la souris devient un pointer au survol
    map.on('mousemove', 'dangers', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'dangers', () => {
      map.getCanvas().style.cursor = '';
    });
  }

  function plotCompteurs({ map, features }: { map: Map; features: Feature[] }) {
    const compteurs = features.filter(isCompteurFeature);
    if (compteurs.length === 0) {
      return;
    }
    compteurs
      .sort((c1, c2) => (c2.properties.counts.at(-1)?.count ?? 0) - (c1.properties.counts.at(-1)?.count ?? 0))
      .map((c, i) => {
        // top counters are bigger and drawn above others
        const top = 10;
        c.properties.circleSortKey = i < top ? 1 : 0;
        c.properties.circleRadius = i < top ? 10 : 7;
        c.properties.circleStrokeWidth = i < top ? 3 : 0;
        return c;
      });

    map.addSource('compteurs', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: compteurs
      }
    });
    map.addLayer({
      id: 'compteurs',
      source: 'compteurs',
      type: 'circle',
      layout: {
        'circle-sort-key': ['get', 'circleSortKey']
      },
      paint: {
        'circle-color': '#152B68',
        'circle-stroke-color': '#fff',
        'circle-stroke-width': ['get', 'circleStrokeWidth'],
        'circle-radius': ['get', 'circleRadius']
      }
    });
    map.on('mouseenter', 'compteurs', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'compteurs', () => (map.getCanvas().style.cursor = ''));
  }

  function getCompteursFeatures({
    counters,
    type
  }: {
    counters: CounterParsedContent[] | null;
    type: 'compteur-velo' | 'compteur-voiture';
  }): CompteurFeature[] {
    if (!counters) { return []; }
    if (counters.length === 0) { return []; }

    return counters.map(counter => ({
      type: 'Feature',
      properties: {
        type,
        name: counter.name,
        link: counter._path,
        counts: counter.counts
      },
      geometry: {
        type: 'Point',
        coordinates: [counter.coordinates[0], counter.coordinates[1]]
      }
    }));
  }

  function fitBounds({ map, features }: { map: Map; features: Feature[] }) {
    const allLineStringsCoordinates = features
      .filter(isLineStringFeature)
      .map(feature => feature.geometry.coordinates)
      .flat();

    const allPointsCoordinates = features.filter(isPointFeature).map(feature => feature.geometry.coordinates);

    if (allPointsCoordinates.length === 0 && allLineStringsCoordinates.length === 0) {
      return;
    }

    if (features.length === 1 && allPointsCoordinates.length === 1) {
      map.flyTo({ center: allPointsCoordinates[0] });
    } else {
      const bounds = new LngLatBounds(allLineStringsCoordinates[0], allLineStringsCoordinates[0]);
      for (const coord of [...allLineStringsCoordinates, ...allPointsCoordinates]) {
        bounds.extend(coord);
      }
      map.fitBounds(bounds, { padding: 20 });
    }
  }

  function plotFeatures({ map, features }: { map: Map; features: Feature[] }) {
    const lineStringFeatures = features.filter(isLineStringFeature).sort(sortByLine).map(addLineColor);

    plotUnderlinedSections({ map, features: lineStringFeatures });
    plotUnsatisfactorySections({ map, features: lineStringFeatures });
    plotDoneSections({ map, features: lineStringFeatures });
    plotPlannedSections({ map, features: lineStringFeatures });
    plotVarianteSections({ map, features: lineStringFeatures });
    plotVariantePostponedSections({ map, features: lineStringFeatures });
    plotWipSections({ map, features: lineStringFeatures });
    plotUnknownSections({ map, features: lineStringFeatures });
    plotPostponedSections({ map, features: lineStringFeatures });

    plotPerspective({ map, features });
    plotCompteurs({ map, features });
    plotPumps({ map, features });
    plotDangers({ map, features });
  }

  function handleMapClick({ map, features, clickEvent }: { map: Map; features: Feature[]; clickEvent: any }) {
    const layers = [
      {
        id: 'dangers',
        isClicked: () => {
          if (!map.getLayer('dangers')) { return false; }
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['dangers'] });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['dangers'] })[0];
          const feature = features.find(f => f.properties.name === mapFeature.properties.name);
          return { feature };
        },
        component: DangerTooltip
      },
      {
        id: 'perspectives',
        isClicked: () => {
          if (!map.getLayer('perspectives')) { return false; }
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['perspectives'] });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['perspectives'] })[0];
          const feature = features.find(f => {
            return f.properties.type === 'perspective' &&
            f.properties.line === mapFeature.properties.line &&
            f.properties.imgUrl === mapFeature.properties.imgUrl;
          });

          return { feature };
        },
        component: PerspectiveTooltip
      },
      {
        id: 'linestring', // not really a layer id. gather all linestrings.
        isClicked: () => {
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, {
            filter: [
              'all',
              ['==', ['geometry-type'], 'LineString'],
              ['!=', ['get', 'source'], 'openmaptiles'], // Exclude base map features
              ['has', 'status'] // All sections in geojson LineStrings have a status
            ]
          });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, {
            filter: [
              'all',
              ['==', ['geometry-type'], 'LineString'],
              ['!=', ['get', 'source'], 'openmaptiles'], // Exclude base map features
              ['has', 'status'] // All sections in geojson LineStrings have a status
            ]
          })[0];

          const line = mapFeature.properties.line;
          const name = mapFeature.properties.name;

          const lineStringFeatures = features.filter(isLineStringFeature);

          const feature = lineStringFeatures
            .find(f => f.properties.line === line && f.properties.name === name);

          const lines = feature!.properties.id
            ? [...new Set(lineStringFeatures.filter(f => f.properties.id === feature!.properties.id).map(f => f.properties.line))]
            : [feature!.properties.line];

          return { feature, lines };
        },
        component: LineTooltip
      },
      {
        id: 'compteurs',
        isClicked: () => {
          if (!map.getLayer('compteurs')) { return false; }
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['compteurs'] });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['compteurs'] })[0];
          const feature = features.find(f => f.properties.name === mapFeature.properties.name);
          return { feature };
        },
        component: CounterTooltip
      }
    ];

    const clickedLayer = layers.find(layer => layer.isClicked());
    if (!clickedLayer) { return; }

    new Popup({ closeButton: false, closeOnClick: true })
      .setLngLat(clickEvent.lngLat)
      .setHTML(`<div id="${clickedLayer.id}-tooltip-content"></div>`)
      .addTo(map);

    const props = clickedLayer.getTooltipProps();
    // @ts-ignore:next
    const component = defineComponent(clickedLayer.component);
    nextTick(() => {
      createApp({
        render: () => h(Suspense, null, {
          default: h(component, props),
          fallback: 'Chargement...'
        })
      }).mount(`#${clickedLayer.id}-tooltip-content`);
    });
  }

  return {
    loadImages,
    plotFeatures,
    getCompteursFeatures,
    fitBounds,
    handleMapClick
  };
};
