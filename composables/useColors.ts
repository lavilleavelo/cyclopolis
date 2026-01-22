import config from '~/config.json';

export const useColors = () => {
  const { palette, customColors } = useSettings();
  const isMounted = ref(false);

  onMounted(() => {
    isMounted.value = true;
  });

  function getLineColor(line: number): string {
    const black = '#000000';

    const effectivePalette = isMounted.value ? palette.value : 'default';
    const effectiveCustomColors = isMounted.value ? customColors.value : {};

    if (effectiveCustomColors[line]) {
      return effectiveCustomColors[line];
    }

    if (effectivePalette === 'accessible') {
      const lineConfig = config.accessibleColors.find((color) => color.line === line);
      return lineConfig?.color || black;
    }

    const lineConfig = config.colors.find((color) => color.line === line);
    if (!lineConfig) {
      return black;
    }
    return lineConfig.color;
  }

  return { getLineColor };
};
