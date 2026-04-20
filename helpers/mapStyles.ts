import type { StyleSpecification } from 'maplibre-gl';
import defaultStyle from '@/assets/style.json';
import hybridStyle from '@/assets/hybrid-style.json';
import osmBrightStyle from '@/assets/osm-bright-style.json';

export type MapStyleKey = 'default' | 'positron' | 'neutrino' | 'osm-bright' | 'hybrid' | 'cyclosm';

const cyclosmAttribution =
  '<a href="https://www.cyclosm.org" target="_blank">CyclOSM</a> (<a href="https://www.cyclosm.org/legend.html" target="_blank">Légende</a>)';
const osmAttribution = '<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

const cyclosmStyle: StyleSpecification = {
  version: 8,
  name: 'CyclOSM',
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: ['https://c.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: [cyclosmAttribution, osmAttribution].join(' | '),
    },
  },
  sprite: 'https://tiles.openfreemap.org/sprites/ofm_f384/ofm',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'raster-tiles',
      type: 'raster',
      source: 'raster-tiles',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

export const MAP_STYLES: Record<MapStyleKey, StyleSpecification | string> = {
  default: defaultStyle as StyleSpecification,
  positron: 'https://tiles.openfreemap.org/styles/positron',
  neutrino: 'https://tiles.versatiles.org/assets/styles/neutrino/style.json',
  'osm-bright': osmBrightStyle as StyleSpecification,
  hybrid: hybridStyle as StyleSpecification,
  cyclosm: cyclosmStyle,
};

export const MAP_STYLE_OPTIONS: { id: MapStyleKey; label: string; description: string }[] = [
  { id: 'default', label: 'Par défaut', description: 'Style officiel de Cyclopolis' },
  { id: 'positron', label: 'Clair', description: 'Fond clair et minimaliste' },
  { id: 'neutrino', label: 'Neutre', description: 'Fond sobre et discret' },
  { id: 'osm-bright', label: 'Coloré', description: 'Style coloré avec bâtiments 3D' },
  { id: 'hybrid', label: 'Satellite', description: 'Photographies aériennes IGN' },
  { id: 'cyclosm', label: 'Vélo', description: 'Style OpenStreetMap alternatif vélo' },
];

export function getMapStyle(key: MapStyleKey): StyleSpecification | string {
  return MAP_STYLES[key] ?? MAP_STYLES.default;
}
