<template>
  <div>
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <input
        type="date"
        :value="day ?? ''"
        :min="min"
        :max="max"
        aria-label="Choisir une journée"
        class="text-sm border border-gray-300 rounded-md py-1 px-2"
        @change="onDateChange"
      />
    </div>
    <ClientOnly>
      <highcharts v-if="day" :options="chartOptions" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import {
  VELO_COLOR,
  VOITURE_COLOR,
  capitalize,
  formatCount,
  formatDay,
  useCounterHours,
  type CounterRef,
} from '~/composables/useCounterDetailedStats';

const props = defineProps<{
  title: string;
  veloCounter: CounterRef;
  voitureCounter: CounterRef;
  min: string;
  max: string;
}>();

const day = defineModel<string | null>('day', { required: true });

type TooltipContext = { points?: { point: { index: number } }[] };

const loadVelo = useCounterHours(props.veloCounter);
const loadVoiture = useCounterHours(props.voitureCounter);
const hours = ref<{ velo: (number | null)[]; voiture: (number | null)[] }>({ velo: [], voiture: [] });

watch(
  day,
  async (selected) => {
    if (!selected) {
      return;
    }

    const [velo, voiture] = await Promise.all([
      loadVelo([selected]).catch(() => []),
      loadVoiture([selected]).catch(() => []),
    ]);
    if (selected === day.value) {
      hours.value = { velo: velo[0]?.hourly ?? [], voiture: voiture[0]?.hourly ?? [] };
    }
  },
  { immediate: true },
);

function onDateChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  if (value) {
    day.value = value;
  }
}

const chartOptions = computed(() => {
  const { velo, voiture } = hours.value;

  return {
    chart: { type: 'line', height: 340 },
    lang: { locale: 'fr-FR' },
    title: { text: props.title },
    subtitle: {
      text: day.value
        ? capitalize(formatDay(day.value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
        : '',
    },
    credits: { enabled: false },
    xAxis: {
      categories: Array.from({ length: 24 }, (_, hour) => `${hour}h`),
      tickInterval: 2,
      crosshair: true,
    },
    yAxis: { min: 0, title: { text: 'Passages / heure' } },
    tooltip: {
      shared: true,
      formatter(this: TooltipContext) {
        const hour = this.points?.[0]?.point.index ?? 0;
        const bikes = velo[hour] ?? null;
        const cars = voiture[hour] ?? null;
        const share =
          bikes !== null && cars !== null && bikes + cars > 0 ? Math.round((bikes / (bikes + cars)) * 100) : null;
        return [
          `<b>${hour}h – ${hour + 1}h</b>`,
          `<span style="color:${VELO_COLOR}">●</span> Vélos : <b>${bikes === null ? '–' : formatCount(bikes)}</b>`,
          `<span style="color:${VOITURE_COLOR}">●</span> Voitures : <b>${cars === null ? '–' : formatCount(cars)}</b>`,
          `Part du vélo : <b>${share ?? '–'} %</b>`,
        ].join('<br/>');
      },
    },
    plotOptions: {
      line: { lineWidth: 2, marker: { enabled: false, symbol: 'circle' } },
    },
    series: [
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
