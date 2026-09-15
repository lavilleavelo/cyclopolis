import type { Collections } from '@nuxt/content';
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
  const match = geojson.path?.match(/ligne-(\d+)$/);
  return match ? Number(match[1]) : NaN;
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
