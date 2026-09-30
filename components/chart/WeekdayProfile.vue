<template>
  <ClientOnly>
    <highcharts :options="chartOptions" />
  </ClientOnly>
</template>

<script setup lang="ts">
import {
  WEEKDAY_COLOR,
  WEEKEND_COLOR,
  capitalize,
  formatCount,
  type CounterDetailedStats,
} from '~/composables/useCounterDetailedStats';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const props = defineProps<{ title: string; stats: CounterDetailedStats; unit?: string }>();

type TooltipContext = { y: number; point: { index: number } };

const chartOptions = computed(() => ({
  chart: { type: 'column', height: 300 },
  lang: { locale: 'fr-FR' },
  title: { text: props.title },
  credits: { enabled: false },
  legend: { enabled: false },
  xAxis: { categories: DAYS.map((day) => `${day.slice(0, 3)}.`) },
  yAxis: { min: 0, title: { text: `${capitalize(props.unit ?? 'passages')} / jour (moyenne)` } },
  tooltip: {
    formatter(this: TooltipContext) {
      return `<b>${DAYS[this.point.index]}</b><br/>${formatCount(this.y)} ${props.unit ?? 'passages'} en moyenne`;
    },
  },
  plotOptions: {
    column: { borderWidth: 0, borderRadius: 4, pointPadding: 0.1, groupPadding: 0.1 },
  },
  series: [
    {
      name: 'Moyenne',
      data: props.stats.weekdayProfile.map((y, index) => ({
        y,
        color: index >= 5 ? WEEKEND_COLOR : WEEKDAY_COLOR,
      })),
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
