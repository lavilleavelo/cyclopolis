<template>
  <div>
    <div class="flex justify-end mb-3">
      <ChartDisplayModeToggle />
    </div>
    <ClientOnly>
      <highcharts :options="chartOptions" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useChartDisplayMode } from '~/composables/useChartDisplayMode';
import type { Count } from '~/types';

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Object, required: true },
  color: { type: String, default: '#152B68' },
  maxColor: { type: String, default: '#C84271' },
});

const mode = useChartDisplayMode();

const counts: Count[] = props.data.counts;

function daysInMonthOf(monthIso: string): number {
  const d = new Date(monthIso);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

const chartOptions = computed(() => {
  const sorted = counts.slice().sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  const isDaily = mode.value === 'daily';
  const values = sorted.map((c) => {
    if (isDaily) {
      return Math.round(c.count / daysInMonthOf(c.month));
    }
    return c.count;
  });

  const max = Math.max(...values, 0);
  const yLabel = isDaily ? 'Passages / jour' : 'Passages';
  const tooltipSuffix = isDaily ? 'passages/jour' : 'passages';

  return {
    chart: { type: 'column', height: 320 },
    title: { text: props.title },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      categories: sorted.map((c) => new Date(c.month).toLocaleString('fr-FR', { month: 'short', year: '2-digit' })),
      labels: { autoRotation: [-45], style: { fontSize: '10px' } },
      tickInterval: Math.max(1, Math.floor(sorted.length / 18)),
    },
    yAxis: { min: 0, title: { text: yLabel } },
    tooltip: {
      formatter(this: { x: string; y: number; point: { index: number } }) {
        const iso = sorted[this.point.index]?.month;
        const fullLabel = iso ? new Date(iso).toLocaleString('fr-FR', { month: 'long', year: 'numeric' }) : this.x;
        const headerLabel = fullLabel.charAt(0).toUpperCase() + fullLabel.slice(1);
        return `<b>${headerLabel}</b><br/>${this.y.toLocaleString('fr-FR')} ${tooltipSuffix}`;
      },
    },
    plotOptions: { column: { pointPadding: 0.05, borderWidth: 0 } },
    series: [
      {
        type: 'column',
        name: yLabel,
        data: values.map((y) => {
          if (y === max && y > 0) {
            return { y, color: props.maxColor };
          }

          return { y, color: props.color };
        }),
      },
    ],
    responsive: {
      rules: [
        {
          condition: { maxWidth: 500 },
          chartOptions: {
            yAxis: { title: { text: undefined } },
          },
        },
      ],
    },
  };
});
</script>
