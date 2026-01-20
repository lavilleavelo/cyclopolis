import { useLocalStorage } from '@vueuse/core';

export const useSettings = () => {
  const palette = useLocalStorage<'default' | 'accessible'>('cyclopolis-palette', 'default');
  const customColors = useLocalStorage<Record<number, string>>('cyclopolis-custom-colors', {});

  return {
    palette,
    customColors,
  };
};
