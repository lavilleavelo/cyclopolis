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
  return lineStringFeature?.properties.line as number;
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
