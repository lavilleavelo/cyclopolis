import { useLocalStorage } from '@vueuse/core';

const palette = useLocalStorage<'default' | 'accessible'>('cyclopolis-palette', 'default');
const customColors = useLocalStorage<Record<number, string>>('cyclopolis-custom-colors', {});
const reduceMotion = useLocalStorage<boolean>('cyclopolis-reduce-motion', false);

export const useSettings = () => {
  return {
    palette,
    customColors,
    reduceMotion,
  };
};
