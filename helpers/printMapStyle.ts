import type { LayerSpecification, Map as MaplibreMap, StyleSpecification } from 'maplibre-gl';
import defaultStyle from '@/assets/style.json';

const COMMUNE_TEXT_SCALE = 0.8;
const COMMUNE_LAYERS = ['place-village', 'place-town'];
const STREET_NAME_LAYER = 'highway-name-major';

// a placer au dessus des autres couches
export const PRIORITY_STREET_NAME_LAYER = 'highway-name-priority';

const ARRONDISSEMENT_INDEX = ['index-of', ' Arrondissement', ['get', 'name']];
const NEIGHBOURHOOD_TEXT_FIELD = [
  'case',
  ['>=', ARRONDISSEMENT_INDEX, 0],
  ['concat', ['slice', ['get', 'name'], 0, ARRONDISSEMENT_INDEX], ' arr.'],
  ['coalesce', ['get', 'name:latin'], ['get', 'name']],
];

const REMOVED_LAYERS =
  /^(water-pattern|poi-|road_oneway|highway-shield|airport-label|place-city|building|tunnel-service-track|(tunnel|highway|bridge)-path)/;
const REMOVED_ROAD_CLASSES = ['service', 'track'];

const PIXEL_PROPERTIES = new Set([
  'line-width',
  'line-gap-width',
  'line-offset',
  'line-blur',
  'line-translate',
  'fill-translate',
  'text-size',
  'text-halo-width',
  'text-halo-blur',
  'text-padding',
  'icon-size',
  'icon-padding',
  'symbol-spacing',
  'circle-radius',
  'circle-stroke-width',
]);
const DEFAULT_SYMBOL_PADDING = 2;
const MAX_ZOOM = 24;

type StyleProperties = Record<string, unknown>;
type LabelOffsets = Record<string, number[]>;

function isZoomExpression(value: unknown[]): boolean {
  const input = value[0] === 'interpolate' ? value[2] : value[1];
  return (value[0] === 'interpolate' || value[0] === 'step') && Array.isArray(input) && input[0] === 'zoom';
}

export function scalePixelValue(value: unknown, scale: number, zoomShift = 0): unknown {
  if (typeof value === 'number') {
    return value * scale;
  }

  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === 'number')) {
      return value.map((item) => item * scale);
    }

    if (isZoomExpression(value)) {
      const head =
        value[0] === 'interpolate' ? value.slice(0, 3) : [value[0], value[1], scalePixelValue(value[2], scale)];
      const stops = value.slice(3).map((item, index) => {
        return index % 2 === 0 ? (item as number) + zoomShift : scalePixelValue(item, scale);
      });
      return [...head, ...stops];
    }

    return ['*', scale, value];
  }

  if (value && typeof value === 'object' && 'stops' in value && Array.isArray(value.stops)) {
    return {
      ...value,
      stops: value.stops.map(([zoom, output]: [number, unknown]) => [zoom + zoomShift, scalePixelValue(output, scale)]),
    };
  }

  return value;
}

function scalePixelProperties(properties: StyleProperties, scale: number, zoomShift = 0): StyleProperties {
  const entries = Object.entries(properties).map(([name, value]) => {
    return [name, PIXEL_PROPERTIES.has(name) ? scalePixelValue(value, scale, zoomShift) : value];
  });
  return Object.fromEntries(entries);
}

function shiftZoomStops<T>(value: T, zoomShift: number): T {
  if (Array.isArray(value)) {
    return value.map((item) => shiftZoomStops(item, zoomShift)) as T;
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const entries = Object.entries(value).map(([key, child]) => {
    if (key === 'stops' && Array.isArray(child)) {
      return [key, child.map(([zoom, output]: [number, unknown]) => [zoom + zoomShift, output])];
    }
    return [key, shiftZoomStops(child, zoomShift)];
  });
  return Object.fromEntries(entries) as T;
}

function removeRoadClasses(filter: unknown): unknown {
  if (!Array.isArray(filter)) {
    return filter;
  }
  if (filter[0] === 'in' && filter[1] === 'class') {
    return filter.filter((item) => !REMOVED_ROAD_CLASSES.includes(item));
  }
  return filter.map(removeRoadClasses);
}

const PLACE_ANCHOR_OFFSETS = [
  'center',
  [0, 0],
  'top',
  [0, 0.4],
  'bottom',
  [0, -0.4],
  'left',
  [0.4, 0],
  'right',
  [-0.4, 0],
];

function getPlaceAnchorOffsets(placeOffsets: LabelOffsets): unknown {
  const customOffsets = Object.entries(placeOffsets).flatMap(([name, offset]) => [
    name,
    ['literal', ['center', offset]],
  ]);
  if (customOffsets.length === 0) {
    return PLACE_ANCHOR_OFFSETS;
  }
  return ['match', ['get', 'name'], ...customOffsets, ['literal', PLACE_ANCHOR_OFFSETS]];
}

const STREET_OFFSET = [0, 1];

function getStreetOffsets(streetOffsets: LabelOffsets): unknown {
  const customOffsets = Object.entries(streetOffsets).flatMap(([name, offset]) => [name, ['literal', offset]]);
  if (customOffsets.length === 0) {
    return STREET_OFFSET;
  }
  return ['match', ['get', 'name'], ...customOffsets, ['literal', STREET_OFFSET]];
}

const STREET_LABEL_PAINT = { 'text-color': '#3f352c', 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 };

function getStreetLabelLayout({
  streetTextSize,
  streetOffsets,
}: Pick<LabelSettings, 'streetTextSize' | 'streetOffsets'>): StyleProperties {
  return {
    'text-size': streetTextSize,
    'text-offset': getStreetOffsets(streetOffsets),
    'text-padding': 0,
    'symbol-spacing': 220,
    'text-max-angle': 120,
  };
}

type LabelSettings = {
  hiddenPlaceNames: string[];
  placeOffsets: LabelOffsets;
  streetOffsets: LabelOffsets;
  neighbourhoodTextSize: number;
  streetTextSize: number;
};

function restyleLayer(
  layer: LayerSpecification,
  { hiddenPlaceNames, placeOffsets, streetOffsets, neighbourhoodTextSize, streetTextSize }: LabelSettings,
): LayerSpecification {
  if (layer.type === 'background') {
    return { ...layer, paint: { ...layer.paint, 'background-color': '#ffffff' } };
  }

  if (layer.type === 'line' && layer.paint?.['line-color'] === '#fff') {
    return { ...layer, paint: { ...layer.paint, 'line-color': '#e9e6e3' } };
  }

  if (layer.type === 'symbol' && (layer.id === STREET_NAME_LAYER || layer.id === PRIORITY_STREET_NAME_LAYER)) {
    return {
      ...layer,
      layout: {
        ...layer.layout,
        ...getStreetLabelLayout({ streetTextSize, streetOffsets }),
        'symbol-sort-key': ['match', ['get', 'class'], 'secondary', 0, ['trunk', 'primary'], 1, 2],
      },
      paint: { ...layer.paint, ...STREET_LABEL_PAINT },
    } as LayerSpecification;
  }

  if (layer.type === 'symbol' && layer.id.startsWith('place-')) {
    const isNeighbourhood = layer.id === 'place-other';
    const isCommune = COMMUNE_LAYERS.includes(layer.id);
    return {
      ...layer,
      filter: ['all', layer.filter ?? ['has', 'name'], ['!in', 'name', ...hiddenPlaceNames]],
      layout: {
        ...layer.layout,
        'text-variable-anchor-offset': getPlaceAnchorOffsets(placeOffsets),
        'text-justify': 'auto',
        ...(isCommune && { 'text-size': scalePixelValue(layer.layout?.['text-size'], COMMUNE_TEXT_SCALE) }),
        ...(isNeighbourhood && {
          'text-field': NEIGHBOURHOOD_TEXT_FIELD,
          'text-size': neighbourhoodTextSize,
          'text-letter-spacing': 0.05,
          'text-padding': 1,
          'symbol-sort-key': ['to-number', ['get', 'rank'], 99],
        }),
      },
      paint: { ...layer.paint, 'text-color': '#1f2937', 'text-halo-color': '#ffffff', 'text-halo-width': 1.6 },
    } as LayerSpecification;
  }

  return layer;
}

export function getPrintMapStyle({
  detailZoomOffset = 0,
  extraTileZoom = 0,
  priorityStreetNames = [],
  hiddenStreetNames = [],
  hiddenPlaceNames = [],
  placeOffsets = {},
  streetOffsets = {},
  neighbourhoodTextSize = 7,
  streetTextSize = 6.5,
}: {
  detailZoomOffset?: number;
  extraTileZoom?: number;
  priorityStreetNames?: string[];
  hiddenStreetNames?: string[];
} & Partial<LabelSettings> = {}): StyleSpecification {
  const style = structuredClone(defaultStyle) as StyleSpecification;
  const sizeScale = 2 ** extraTileZoom;
  const zoomShift = extraTileZoom - detailZoomOffset;

  style.layers = style.layers
    .filter((layer) => !REMOVED_LAYERS.test(layer.id))
    .flatMap((layer) => {
      if (layer.id !== STREET_NAME_LAYER) {
        return [layer];
      }

      const excludedNames = [...priorityStreetNames, ...hiddenStreetNames];
      const streetLayer = {
        ...layer,
        filter: ['all', layer.filter ?? ['has', 'name'], ['!in', 'name', ...excludedNames]],
      };
      if (priorityStreetNames.length === 0) {
        return [streetLayer] as LayerSpecification[];
      }
      return [
        streetLayer,
        { ...layer, id: PRIORITY_STREET_NAME_LAYER, filter: ['in', 'name', ...priorityStreetNames] },
      ] as LayerSpecification[];
    })
    .map((layer) => {
      return restyleLayer(layer, {
        hiddenPlaceNames,
        placeOffsets,
        streetOffsets,
        neighbourhoodTextSize,
        streetTextSize,
      });
    })
    .map((layer) => {
      const paint = shiftZoomStops((layer.paint ?? {}) as StyleProperties, zoomShift);
      const layout = shiftZoomStops(('layout' in layer ? (layer.layout ?? {}) : {}) as StyleProperties, zoomShift);
      if (layer.type === 'symbol') {
        layout['text-padding'] ??= DEFAULT_SYMBOL_PADDING;
        layout['icon-padding'] ??= DEFAULT_SYMBOL_PADDING;
      }

      return {
        ...layer,
        ...('filter' in layer && { filter: removeRoadClasses(layer.filter) }),
        ...(layer.minzoom !== undefined && { minzoom: Math.max(0, layer.minzoom + zoomShift) }),
        ...(layer.maxzoom !== undefined && { maxzoom: Math.max(0, layer.maxzoom + zoomShift) }),
        paint: scalePixelProperties(paint, sizeScale),
        layout: scalePixelProperties(layout, sizeScale),
      } as LayerSpecification;
    });

  return style;
}

export type ExtraStreetLabel = { name: string; coordinates: number[][] };
export const EXTRA_STREET_LABELS_ID = 'print-extra-street-labels';

export function getExtraStreetLabels({
  labels,
  streetTextSize,
  streetOffsets,
}: { labels: ExtraStreetLabel[] } & Pick<LabelSettings, 'streetTextSize' | 'streetOffsets'>) {
  const source = {
    type: 'geojson' as const,
    data: {
      type: 'FeatureCollection' as const,
      features: labels.map(({ name, coordinates }) => ({
        type: 'Feature' as const,
        properties: { name },
        geometry: { type: 'LineString' as const, coordinates },
      })),
    },
  };

  const layer = {
    id: EXTRA_STREET_LABELS_ID,
    type: 'symbol',
    source: EXTRA_STREET_LABELS_ID,
    layout: {
      // avec `line`, une rue plus courte que l'espacement entre deux répétitions n'aurait aucun emplacement
      'symbol-placement': 'line-center',
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-rotation-alignment': 'map',
      ...getStreetLabelLayout({ streetTextSize, streetOffsets }),
    },
    paint: { ...STREET_LABEL_PAINT, 'text-halo-blur': 0.5 },
  } as LayerSpecification;

  return { source, layer };
}

export function isRaisedLabelLayer(layerId: string): boolean {
  return layerId === STREET_NAME_LAYER || layerId.startsWith('place-');
}

export function scaleOverlayLayers({
  map,
  basemapLayerIds,
  extraTileZoom,
  lineWidthScale = 1,
}: {
  map: MaplibreMap;
  basemapLayerIds: Set<string>;
  extraTileZoom: number;
  lineWidthScale?: number;
}) {
  const overlayLayers = map.getStyle().layers.filter((layer) => !basemapLayerIds.has(layer.id));

  for (const layer of overlayLayers) {
    const sizeScale = 2 ** extraTileZoom * (layer.type === 'line' ? lineWidthScale : 1);
    const paint = (layer.paint ?? {}) as StyleProperties;
    const layout = { ...(('layout' in layer ? layer.layout : undefined) ?? {}) } as StyleProperties;
    if (layer.type === 'symbol') {
      layout['text-padding'] ??= DEFAULT_SYMBOL_PADDING;
      layout['icon-padding'] ??= DEFAULT_SYMBOL_PADDING;
    }

    for (const [name, value] of Object.entries(scalePixelProperties(paint, sizeScale, extraTileZoom))) {
      if (PIXEL_PROPERTIES.has(name)) {
        map.setPaintProperty(layer.id, name, value);
      }
    }
    for (const [name, value] of Object.entries(scalePixelProperties(layout, sizeScale, extraTileZoom))) {
      if (PIXEL_PROPERTIES.has(name)) {
        map.setLayoutProperty(layer.id, name, value);
      }
    }

    if (layer.minzoom !== undefined || layer.maxzoom !== undefined) {
      map.setLayerZoomRange(
        layer.id,
        (layer.minzoom ?? 0) + (layer.minzoom !== undefined ? extraTileZoom : 0),
        Math.min(MAX_ZOOM, (layer.maxzoom ?? MAX_ZOOM) + extraTileZoom),
      );
    }
  }
}
