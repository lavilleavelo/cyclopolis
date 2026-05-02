export type ChartDisplayMode = 'total' | 'daily';

export function useChartDisplayMode() {
  return useState<ChartDisplayMode>('chart-display-mode', () => 'total');
}
