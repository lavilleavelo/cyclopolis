<template>
  <ClientOnly>
    <highcharts :options="chartOptions" />
  </ClientOnly>
</template>

<script setup lang="ts">
import { capitalize, formatDay } from '~/composables/useCounterDetailedStats';
import { SCOOTER_COLOR, formatShare, type ScooterStats } from '~/composables/useCounterSensor';

const props = defineProps<{ title: string; subtitle?: string; monthly: ScooterStats['monthly'] }>();

type TooltipContext = { point: { index: number } };

function monthLabel(month: string, options: Intl.DateTimeFormatOptions): string {
  return formatDay(`${month}-01`, options);
}

const chartOptions = computed(() => ({
  chart: { type: 'column', height: 300 },
  lang: { locale: 'fr-FR' },
  title: { text: props.title },
  subtitle: { text: props.subtitle },
  credits: { enabled: false },
  legend: { enabled: false },
  xAxis: {
    categories: props.monthly.map(({ month }) => monthLabel(month, { month: 'short', year: '2-digit' })),
  },
  yAxis: { min: 0, title: { text: 'Part estimée des trottinettes' }, labels: { format: '{value}\u00A0%' } },
  tooltip: {
    formatter(this: TooltipContext) {
      const entry = props.monthly[this.point.index];
      if (!entry) {
        return false;
      }

      const month = capitalize(monthLabel(entry.month, { month: 'long', year: 'numeric' }));
      return `<b>${month}</b><br/>${formatShare(entry.share)} de trottinettes (estimation)`;
    },
  },
  plotOptions: {
    column: { borderWidth: 0, borderRadius: 3, pointPadding: 0.05, groupPadding: 0.05, color: SCOOTER_COLOR },
  },
  series: [
    {
      name: 'Trottinettes',
      data: props.monthly.map(({ share }) => (share === null ? null : Math.round(share * 1000) / 10)),
    },
  ],
  responsive: {
    rules: [
      {
        condition: { maxWidth: 500 },
        chartOptions: { yAxis: { title: { text: undefined } } },
      },
    ],
  },
}));
</script>
