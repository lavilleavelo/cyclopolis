import type { Collections } from '@nuxt/content';
import config from '~/config.json';
import { getLineFromFileName } from '~/helpers/lines';
import { isLineStringFeature } from '~/types';

export const useGetVoiesCyclablesNums = async () => {
  const { data } = await useAsyncData('voiesCyclablesNums', () => {
    return queryCollection('voiesCyclablesPage').order('line', 'ASC').all();
  });
  return { voies: data };
};

export function getLine(geojson: Collections['voiesCyclablesGeojson']): number {
  const lineStringFeature = geojson.features.find(isLineStringFeature);
  if (lineStringFeature) {
    return lineStringFeature.properties.line;
  }
  // fichier sans tronçon (ligne en cours de saisie) : le numéro est déduit du nom du fichier
  return getLineFromFileName(geojson.path) ?? NaN;
}

export const useVoiesCyclablesGeojson = async () => {
  const {
    data: geojsons,
    refresh,
    pending,
  } = await useAsyncData('voiesCyclablesGeojson', async () => {
    const lines = await queryCollection('voiesCyclablesGeojson').all();
    return lines.toSorted((a, b) => {
      const lineA = getLine(a);
      const lineB = getLine(b);
      return lineA - lineB;
    });
  });
  return { geojsons, refresh, pending };
};

export const useOtherNetworksGeojson = async () => {
  const { data: otherNetworks } = await useAsyncData('otherNetworksGeojson', async () => {
    const geojsons = await queryCollection('autresReseauxGeojson').all();
    return config.otherNetworks.map((network) => {
      const geojson = geojsons.find((item) => item.path?.endsWith(`/${network.id}`));
      const features: Collections['voiesCyclablesGeojson']['features'] = (geojson?.features ?? []).map((feature) => ({
        ...feature,
        properties: { ...feature.properties, line: network.line, excludeFromStats: true },
      }));
      return { line: network.line, features };
    });
  });
  return { otherNetworks };
};
