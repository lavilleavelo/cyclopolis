import type {
  ExpressionSpecification,
  FilterSpecification,
  LayerSpecification,
  Map as MaplibreMap,
  StyleSpecification,
} from 'maplibre-gl';
import defaultStyle from '@/assets/style.json';

const COMMUNE_TEXT_SCALE = 0.8;
const COMMUNE_LAYERS = ['place-village', 'place-town'];
const NEIGHBOURHOOD_LAYER = 'place-other';
const STREET_NAME_LAYER = 'highway-name-major';
const MINOR_STREET_NAME_LAYER = 'highway-name-minor';

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

const PAPER_REMOVED_LAYERS =
  /((?<!minor)-casing$|-hatching$|^landuse-(?!cemetery)|^landcover-(glacier|ice-shelf|sand|grass$)|^water-offset$|^water(way)?-name|^ferry$|^railway-transit)/;
const PAPER_KEPT_LAYERS = /^(highway|bridge)-path$/;
const PAPER_COLORS = {
  green: '#d5e8c1',
  water: '#a9dcf5',
  road: '#d2d2d2',
  motorway: '#c4c4c4',
  roadArea: '#e2e2e2',
  path: '#e2e2e2',
  rail: '#b9b9b9',
  label: '#111111',
  minorStreetLabel: '#333333',
  station: '#1e3a8a',
};
const PAPER_TUNNEL_OPACITY = 0.45;
const PAPER_SPORT_CLASSES = ['cemetery', 'pitch', 'stadium'];

const PAPER_LABEL_MIN_ZOOM = 12;
const PAPER_MINOR_STREET_TEXT_SCALE = 0.9;

const LABEL_NAME: ExpressionSpecification = ['coalesce', ['get', 'name:latin'], ['get', 'name']];
const STREET_ABBREVIATIONS: [string, string][] = [
  ['Boulevard ', 'Bd '],
  ['Avenue ', 'Av. '],
  ['Impasse ', 'Imp. '],
  ['Chemin ', 'Ch. '],
  ['Allée ', 'All. '],
  ['Place ', 'Pl. '],
  ['Route ', 'Rte '],
  ['Rue ', 'R. '],
];
const ABBREVIATED_STREET_NAME = [
  'case',
  ...STREET_ABBREVIATIONS.flatMap(([prefix, abbreviation]) => [
    ['==', ['slice', LABEL_NAME, 0, prefix.length], prefix],
    ['concat', abbreviation, ['slice', LABEL_NAME, prefix.length]],
  ]),
  LABEL_NAME,
] as ExpressionSpecification;

export type LabelFonts = { street: string; commune: string; neighbourhood: string };
const DEFAULT_LABEL_FONTS: LabelFonts = {
  street: 'Noto Sans Regular',
  commune: 'Noto Sans Regular',
  neighbourhood: 'Noto Sans Bold',
};

function toPaperLayer(layer: LayerSpecification): LayerSpecification {
  if (layer.id === 'landuse-cemetery') {
    return {
      ...layer,
      filter: ['in', 'class', ...PAPER_SPORT_CLASSES],
      paint: { 'fill-color': PAPER_COLORS.green, 'fill-opacity': 0.5 },
    } as LayerSpecification;
  }

  if (layer.type === 'line' && layer.id.endsWith('-path')) {
    return {
      ...layer,
      paint: {
        'line-color': PAPER_COLORS.path,
        'line-width': {
          type: 'exponential',
          stops: [
            [13, 0.5],
            [15, 1.2],
            [20, 4],
          ],
        },
      },
    } as LayerSpecification;
  }

  if (layer.type === 'fill') {
    const sourceLayer = layer['source-layer'];
    const color =
      sourceLayer === 'water'
        ? PAPER_COLORS.water
        : sourceLayer === 'landcover' || sourceLayer === 'park'
          ? PAPER_COLORS.green
          : PAPER_COLORS.roadArea;
    return { ...layer, paint: { 'fill-color': color } };
  }

  if (layer.type === 'line') {
    const isRail = layer.id.includes('railway');
    const color =
      layer['source-layer'] === 'waterway'
        ? PAPER_COLORS.water
        : isRail
          ? PAPER_COLORS.rail
          : layer.id.includes('motorway')
            ? PAPER_COLORS.motorway
            : PAPER_COLORS.road;
    const { 'line-dasharray': dasharray, 'line-width': width } = layer.paint ?? {};
    return {
      ...layer,
      paint: {
        'line-color': color,
        ...(width !== undefined && { 'line-width': width }),
        ...(isRail && dasharray !== undefined && { 'line-dasharray': dasharray }),
        ...(layer.id.startsWith('tunnel-') && { 'line-opacity': PAPER_TUNNEL_OPACITY }),
      },
    } as LayerSpecification;
  }

  return layer;
}

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
const ADDED_STREET_OFFSET = [0, 1.2];

function getStreetOffsets(streetOffsets: LabelOffsets, defaultOffset = STREET_OFFSET): unknown {
  const customOffsets = Object.entries(streetOffsets).flatMap(([name, offset]) => [name, ['literal', offset]]);
  if (customOffsets.length === 0) {
    return defaultOffset;
  }
  return ['match', ['get', 'name'], ...customOffsets, ['literal', defaultOffset]];
}

const STREET_LABEL_PAINT = { 'text-color': '#3f352c', 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 };
const STREET_LABEL_MAX_ANGLE = 60;

function getStreetLabelLayout({
  streetTextSize,
  streetOffsets,
  defaultOffset,
}: Pick<LabelSettings, 'streetTextSize' | 'streetOffsets'> & { defaultOffset?: number[] }): StyleProperties {
  return {
    'text-size': streetTextSize,
    'text-offset': getStreetOffsets(streetOffsets, defaultOffset),
    'text-padding': 0,
    'symbol-spacing': 220,
    'text-max-angle': 120,
  };
}

type LabelSettings = {
  paperBasemap: boolean;
  labelFonts: LabelFonts;
  hiddenPlaceNames: string[];
  placeOffsets: LabelOffsets;
  streetOffsets: LabelOffsets;
  neighbourhoodTextSize: number;
  streetTextSize: number;
};

function toPaperLabelLayer(
  layer: LayerSpecification,
  {
    labelFonts,
    streetTextSize,
    hiddenStreetNames,
  }: Pick<LabelSettings, 'labelFonts' | 'streetTextSize'> & {
    hiddenStreetNames: string[];
  },
): LayerSpecification | undefined {
  if (layer.type !== 'symbol') {
    return undefined;
  }

  if (layer.id === MINOR_STREET_NAME_LAYER) {
    const filter: FilterSpecification = [
      'all',
      ['==', '$type', 'LineString'],
      // les rues piétonnes sont des chemins pour OpenMapTiles
      [
        'any',
        ['==', 'class', 'minor'],
        ['all', ['==', 'class', 'path'], ['in', 'subclass', 'pedestrian', 'living_street']],
      ],
      ['!in', 'name', ...hiddenStreetNames],
    ];
    return {
      ...layer,
      minzoom: PAPER_LABEL_MIN_ZOOM,
      filter,
      layout: {
        ...layer.layout,
        'text-field': ABBREVIATED_STREET_NAME,
        'text-font': [labelFonts.street],
        'text-size': streetTextSize * PAPER_MINOR_STREET_TEXT_SCALE,
        'text-padding': 1,
        'symbol-spacing': 220,
        'text-max-angle': 120,
      },
      paint: { 'text-color': PAPER_COLORS.minorStreetLabel, 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 },
    } as LayerSpecification;
  }

  return undefined;
}

function restyleLayer(
  layer: LayerSpecification,
  {
    paperBasemap,
    labelFonts,
    hiddenPlaceNames,
    placeOffsets,
    streetOffsets,
    neighbourhoodTextSize,
    streetTextSize,
  }: LabelSettings,
): LayerSpecification {
  if (layer.type === 'background') {
    return { ...layer, paint: { ...layer.paint, 'background-color': '#ffffff' } };
  }

  if (paperBasemap && (layer.type === 'fill' || layer.type === 'line')) {
    return toPaperLayer(layer);
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
        ...(layer.id === STREET_NAME_LAYER && { 'text-max-angle': STREET_LABEL_MAX_ANGLE }),
        'text-font': [labelFonts.street],
        'symbol-sort-key': ['match', ['get', 'class'], 'secondary', 0, ['trunk', 'primary'], 1, 2],
      },
      paint: { ...layer.paint, ...STREET_LABEL_PAINT, ...(paperBasemap && { 'text-color': PAPER_COLORS.label }) },
    } as LayerSpecification;
  }

  if (layer.type === 'symbol' && layer.id.startsWith('place-')) {
    const isNeighbourhood = layer.id === NEIGHBOURHOOD_LAYER;
    const isCommune = COMMUNE_LAYERS.includes(layer.id);
    return {
      ...layer,
      filter: ['all', layer.filter ?? ['has', 'name'], ['!in', 'name', ...hiddenPlaceNames]],
      layout: {
        ...layer.layout,
        'text-variable-anchor-offset': getPlaceAnchorOffsets(placeOffsets),
        'text-justify': 'auto',
        ...(isCommune && { 'text-font': [labelFonts.commune] }),
        ...(isNeighbourhood && { 'text-font': [labelFonts.neighbourhood] }),
        ...(isCommune && { 'text-size': scalePixelValue(layer.layout?.['text-size'], COMMUNE_TEXT_SCALE) }),
        ...(isNeighbourhood && {
          'text-field': NEIGHBOURHOOD_TEXT_FIELD,
          'text-size': neighbourhoodTextSize,
          'text-letter-spacing': 0.05,
          'text-padding': 1,
          'symbol-sort-key': ['to-number', ['get', 'rank'], 99],
        }),
      },
      paint: {
        ...layer.paint,
        'text-color': paperBasemap ? PAPER_COLORS.label : '#1f2937',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.6,
      },
    } as LayerSpecification;
  }

  return layer;
}

export function getPrintMapStyle({
  detailZoomOffset = 0,
  extraTileZoom = 0,
  paperBasemap = false,
  labelFonts = DEFAULT_LABEL_FONTS,
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

  const excludedStreetNames = [...priorityStreetNames, ...hiddenStreetNames];
  const keptLayers = style.layers.filter((layer) => {
    if (paperBasemap && PAPER_KEPT_LAYERS.test(layer.id)) {
      return true;
    }
    return !REMOVED_LAYERS.test(layer.id) && !(paperBasemap && PAPER_REMOVED_LAYERS.test(layer.id));
  });

  style.layers = keptLayers
    .flatMap((layer) => {
      if (layer.id !== STREET_NAME_LAYER) {
        return [layer];
      }

      const streetLayer = {
        ...layer,
        filter: ['all', layer.filter ?? ['has', 'name'], ['!in', 'name', ...excludedStreetNames]],
      };
      const priorityLayers =
        priorityStreetNames.length === 0
          ? []
          : [{ ...layer, id: PRIORITY_STREET_NAME_LAYER, filter: ['in', 'name', ...priorityStreetNames] }];
      return [streetLayer, ...priorityLayers] as LayerSpecification[];
    })
    .map((layer) => {
      const paperLabelLayer = paperBasemap
        ? toPaperLabelLayer(layer, {
            labelFonts,
            streetTextSize,
            hiddenStreetNames: excludedStreetNames,
          })
        : undefined;
      return (
        paperLabelLayer ??
        restyleLayer(layer, {
          paperBasemap,
          labelFonts,
          hiddenPlaceNames,
          placeOffsets,
          streetOffsets,
          neighbourhoodTextSize,
          streetTextSize,
        })
      );
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
export const OPTIONAL_STREET_LABELS_ID = 'print-optional-street-labels';
export const OPTIONAL_STREET_LABELS_BEFORE_ID = STREET_NAME_LAYER;
const OPTIONAL_LABEL_PADDING = 3;
const OPTIONAL_LABEL_MAX_ANGLE = 45;

export function getExtraStreetLabels({
  labels,
  streetTextSize,
  streetOffsets,
  paperBasemap = false,
  labelFonts = DEFAULT_LABEL_FONTS,
  optional = false,
}: { labels: ExtraStreetLabel[]; optional?: boolean } & Pick<LabelSettings, 'streetTextSize' | 'streetOffsets'> &
  Partial<Pick<LabelSettings, 'paperBasemap' | 'labelFonts'>>) {
  const id = optional ? OPTIONAL_STREET_LABELS_ID : EXTRA_STREET_LABELS_ID;
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
    id,
    type: 'symbol',
    source: id,
    layout: {
      // avec `line`, une rue plus courte que l'espacement entre deux répétitions n'aurait aucun emplacement
      'symbol-placement': 'line-center',
      'text-field': ['get', 'name'],
      'text-font': [labelFonts.street],
      'text-rotation-alignment': 'map',
      ...getStreetLabelLayout({ streetTextSize, streetOffsets, defaultOffset: ADDED_STREET_OFFSET }),
      ...(optional && { 'text-padding': OPTIONAL_LABEL_PADDING, 'text-max-angle': OPTIONAL_LABEL_MAX_ANGLE }),
    },
    paint: {
      ...STREET_LABEL_PAINT,
      ...(paperBasemap && { 'text-color': PAPER_COLORS.label }),
      'text-halo-blur': 0.5,
    },
  } as LayerSpecification;

  return { source, layer };
}

export type MetroStation = {
  station: string;
  label: string;
  lines: string[];
  coordinates: number[];
  labelOffset?: number;
};
export type TrainStation = { station: string; label: string; coordinates: number[] };
export const METRO_STATIONS_ID = 'print-metro-stations';
export const TRAIN_STATIONS_ID = 'print-train-stations';
const TRAIN_ICON = 'railway_11';
const TRAIN_ICON_SIZE = 0.55;
const TRAIN_TEXT_SCALE = 0.8;
const METRO_ICON_PREFIX = 'print-metro-';
const METRO_INTERCHANGE_ICON = `${METRO_ICON_PREFIX}correspondance`;
const METRO_ICON_SIZE = 5;
const METRO_ICON_PIXEL_RATIO = 8;
const METRO_TEXT_SCALE = 0.9;

function createMetroIcon(fill: string, stroke: string, strokeWidth: number): ImageData {
  const size = METRO_ICON_SIZE * METRO_ICON_PIXEL_RATIO;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d')!;
  const lineWidth = strokeWidth * METRO_ICON_PIXEL_RATIO;
  context.beginPath();
  context.arc(size / 2, size / 2, (size - lineWidth) / 2, 0, 2 * Math.PI);
  context.fillStyle = fill;
  context.fill();
  context.lineWidth = lineWidth;
  context.strokeStyle = stroke;
  context.stroke();
  return context.getImageData(0, 0, size, size);
}

export function addMetroStationIcons(map: MaplibreMap, lineColors: Record<string, string>) {
  const icons = {
    ...Object.fromEntries(
      Object.entries(lineColors).map(([line, color]) => [
        `${METRO_ICON_PREFIX}${line}`,
        createMetroIcon(color, '#ffffff', 1),
      ]),
    ),
    [METRO_INTERCHANGE_ICON]: createMetroIcon('#ffffff', '#1f2937', 1.2),
  };
  for (const [id, image] of Object.entries(icons)) {
    if (!map.hasImage(id)) {
      map.addImage(id, image, { pixelRatio: METRO_ICON_PIXEL_RATIO });
    }
  }
}

export function getMetroStations({
  stations,
  streetTextSize,
  labelFonts = DEFAULT_LABEL_FONTS,
}: { stations: MetroStation[] } & Pick<LabelSettings, 'streetTextSize'> & Partial<Pick<LabelSettings, 'labelFonts'>>) {
  const source = {
    type: 'geojson' as const,
    data: {
      type: 'FeatureCollection' as const,
      features: stations.map(({ label, lines, coordinates, labelOffset }) => ({
        type: 'Feature' as const,
        properties: {
          name: label,
          ...(labelOffset !== undefined && { labelOffset }),
          icon: lines.length > 1 ? METRO_INTERCHANGE_ICON : `${METRO_ICON_PREFIX}${lines[0]}`,
        },
        geometry: { type: 'Point' as const, coordinates },
      })),
    },
  };

  const layer = {
    id: METRO_STATIONS_ID,
    type: 'symbol',
    source: METRO_STATIONS_ID,
    layout: {
      'icon-image': ['get', 'icon'],
      'icon-size': 1,
      ...getStationLabelLayout({ textSize: streetTextSize * METRO_TEXT_SCALE, labelFonts }),
    },
    paint: STATION_LABEL_PAINT,
  } as LayerSpecification;

  return { source, layer };
}

export function getTrainStations({
  stations,
  streetTextSize,
  labelFonts = DEFAULT_LABEL_FONTS,
}: { stations: TrainStation[] } & Pick<LabelSettings, 'streetTextSize'> & Partial<Pick<LabelSettings, 'labelFonts'>>) {
  const source = {
    type: 'geojson' as const,
    data: {
      type: 'FeatureCollection' as const,
      features: stations.map(({ label, coordinates }) => ({
        type: 'Feature' as const,
        properties: { name: label },
        geometry: { type: 'Point' as const, coordinates },
      })),
    },
  };

  const layer = {
    id: TRAIN_STATIONS_ID,
    type: 'symbol',
    source: TRAIN_STATIONS_ID,
    layout: {
      'icon-image': TRAIN_ICON,
      'icon-size': TRAIN_ICON_SIZE,
      ...getStationLabelLayout({ textSize: streetTextSize * TRAIN_TEXT_SCALE, labelFonts }),
    },
    paint: STATION_LABEL_PAINT,
  } as LayerSpecification;

  return { source, layer };
}

const STATION_LABEL_OFFSET = 0.55;
const STATION_LABEL_PAINT = {
  'text-color': PAPER_COLORS.station,
  'text-halo-color': '#ffffff',
  'text-halo-width': 1.2,
};

function getStationLabelLayout({
  textSize,
  labelFonts,
}: {
  textSize: number;
  labelFonts: LabelFonts;
}): StyleProperties {
  return {
    'icon-allow-overlap': true,
    'text-field': ['get', 'name'],
    'text-font': [labelFonts.street],
    'text-size': textSize,
    'text-variable-anchor': ['left', 'right', 'top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
    'text-radial-offset': ['coalesce', ['get', 'labelOffset'], STATION_LABEL_OFFSET],
    'text-justify': 'auto',
    'text-max-width': 7,
    'text-optional': true,
    'text-padding': 1,
  };
}

export function isPlaceLabelLayer(layerId: string): boolean {
  return layerId.startsWith('place-');
}

export function isNeighbourhoodLabelLayer(layerId: string): boolean {
  return layerId === NEIGHBOURHOOD_LAYER;
}

export function isRaisedLabelLayer(layerId: string): boolean {
  return [MINOR_STREET_NAME_LAYER, STREET_NAME_LAYER].includes(layerId) || isPlaceLabelLayer(layerId);
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
