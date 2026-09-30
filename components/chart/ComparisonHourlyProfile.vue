<template>
  <div>
    <div class="flex flex-wrap justify-between items-start gap-2 mb-4">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="type in DAY_TYPES"
          :key="type.value"
          :class="[
            'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
            dayType === type.value ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
          @click="dayType = type.value"
        >
          {{ type.label }}
        </button>
      </div>
      <ChartComparisonModeToggle v-model="mode" />
    </div>
    <ClientOnly>
      <highcharts :options="chartOptions" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import {
  VELO_COLOR,
  VOITURE_COLOR,
  formatCount,
  formatPercent,
  type CounterProfile,
  type DayType,
} from '~/composables/useCounterDetailedStats';
import { useQueryParam, valuesQueryParam } from '~/composables/useQueryParam';

const DAY_TYPES: { value: DayType; label: string }[] = [
  { value: 'weekday', label: 'Jours ouvrés' },
  { value: 'schoolHoliday', label: 'Vacances scolaires' },
  { value: 'weekend', label: 'Weekend et fériés' },
];

const props = defineProps<{ title: string; subtitle: string; velo: CounterProfile; voiture: CounterProfile }>();

const dayType = ref<DayType>('weekday');
const mode = ref<'count' | 'share'>('count');
useQueryParam(
  'profil-type',
  dayType,
  valuesQueryParam<DayType>({ ouvre: 'weekday', vacances: 'schoolHoliday', weekend: 'weekend' }),
);
useQueryParam('profil', mode, valuesQueryParam({ passages: 'count', part: 'share' }));

type TooltipContext = { points?: { point: { index: number } }[] };

function bikeShare(velo: number | null, voiture: number | null): number | null {
  if (velo === null || voiture === null || velo + voiture === 0) {
    return null;
  }

  return Math.round((velo / (velo + voiture)) * 1000) / 10;
}

const chartOptions = computed(() => {
  const velo = props.velo.hourlyProfile[dayType.value];
  const voiture = props.voiture.hourlyProfile[dayType.value];
  const share = velo.map((count, hour) => bikeShare(count, voiture[hour] ?? null));
  const isShare = mode.value === 'share';

  return {
    chart: { type: 'line', height: 340 },
    lang: { locale: 'fr-FR' },
    title: { text: props.title },
    subtitle: { text: props.subtitle },
    credits: { enabled: false },
    legend: { enabled: !isShare },
    xAxis: {
      categories: velo.map((_, hour) => `${hour}h`),
      tickInterval: 2,
      crosshair: true,
    },
    yAxis: {
      min: 0,
      title: { text: isShare ? 'Part du vélo' : 'Passages / heure (moyenne)' },
      labels: { format: isShare ? '{value} %' : '{value}' },
    },
    tooltip: {
      shared: true,
      formatter(this: TooltipContext) {
        const hour = this.points?.[0]?.point.index ?? 0;
        return [
          `<b>${hour}h – ${hour + 1}h</b>`,
          `<span style="color:${VELO_COLOR}">●</span> Vélos : <b>${formatCount(velo[hour] ?? 0)}</b>`,
          `<span style="color:${VOITURE_COLOR}">●</span> Voitures : <b>${formatCount(voiture[hour] ?? 0)}</b>`,
          `Part du vélo : <b>${formatPercent(share[hour])}</b>`,
        ].join('<br/>');
      },
    },
    plotOptions: {
      line: { lineWidth: 2, marker: { enabled: false, symbol: 'circle' } },
    },
    series: isShare
      ? [{ name: 'Part du vélo', color: VELO_COLOR, data: share }]
      : [
          { name: 'Vélos', color: VELO_COLOR, data: velo },
          { name: 'Voitures', color: VOITURE_COLOR, data: voiture },
        ],
    responsive: {
      rules: [
        {
          condition: { maxWidth: 500 },
          chartOptions: { yAxis: { title: { text: undefined } } },
        },
      ],
    },
  };
});
</script>
