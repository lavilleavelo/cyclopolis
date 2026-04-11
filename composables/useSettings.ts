import { useLocalStorage } from '@vueuse/core';
import type { MapStyleKey } from '~/helpers/mapStyles';

const palette = useLocalStorage<'default' | 'accessible'>('cyclopolis-palette', 'default');
const customColors = useLocalStorage<Record<number, string>>('cyclopolis-custom-colors', {});
const reduceMotion = useLocalStorage<boolean>('cyclopolis-reduce-motion', true);
const mapStyle = useLocalStorage<MapStyleKey>('cyclopolis-map-style', 'default');

export const useSettings = () => {
  return {
    palette,
    customColors,
    reduceMotion,
    mapStyle,
  };
};
