import { useLocalStorage } from '@vueuse/core';
import type { MapDisplayMode } from '~/helpers/map-display';
import type { MapStyleKey } from '~/helpers/mapStyles';

const palette = useLocalStorage<'default' | 'accessible'>('cyclopolis-palette', 'default');
const customColors = useLocalStorage<Record<number, string>>('cyclopolis-custom-colors', {});
const reduceMotion = useLocalStorage<boolean>('cyclopolis-reduce-motion', true);
const mapStyle = useLocalStorage<MapStyleKey>('cyclopolis-map-style', 'default');
const mapDisplayMode = ref<MapDisplayMode>('line');

export const useSettings = () => {
  return {
    palette,
    customColors,
    reduceMotion,
    mapStyle,
    mapDisplayMode,
  };
};
