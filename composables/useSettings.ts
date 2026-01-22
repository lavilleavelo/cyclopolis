import { useLocalStorage } from '@vueuse/core';

const palette = useLocalStorage<'default' | 'accessible'>('cyclopolis-palette', 'default');
const customColors = useLocalStorage<Record<number, string>>('cyclopolis-custom-colors', {});

export const useSettings = () => {
  return {
    palette,
    customColors,
  };
};
