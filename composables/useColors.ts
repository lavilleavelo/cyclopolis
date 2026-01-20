import config from '~/config.json';

export const useColors = () => {
  const { palette, customColors } = useSettings();

  function getLineColor(line: number): string {
    const black = '#000000';

    if (customColors.value[line]) {
      return customColors.value[line];
    }

    if (palette.value === 'accessible') {
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
