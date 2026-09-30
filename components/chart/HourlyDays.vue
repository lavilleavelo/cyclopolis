<template>
  <div>
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <span
        v-for="selected in days"
        :key="selected.day"
        class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-3 pr-1 text-sm text-gray-700"
      >
        <span class="h-2.5 w-2.5 rounded-full" :style="{ background: selected.color }" />
        {{ dayLabel(selected.day) }}
        <span v-if="hoursByDay[selected.day] === null" class="text-xs text-gray-400">(indisponible)</span>
        <button
          type="button"
          class="rounded-full px-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
          :aria-label="`Retirer ${dayLabel(selected.day)}`"
          @click="emit('remove', selected.day)"
        >
          ×
        </button>
      </span>
      <input
        type="date"
        :min="stats.firstDay"
        :max="latestDay"
        aria-label="Ajouter une journée"
        class="text-sm border border-gray-300 rounded-md py-1 px-2"
        @change="onDateChange"
      />
      <button
        v-if="record && !days.some((selected) => selected.day === record.day)"
        type="button"
        class="px-3 py-1.5 text-sm rounded-md font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
        @click="emit('add', record.day)"
      >
        Jour record
      </button>
    </div>
    <ClientOnly>
      <highcharts v-if="days.length > 0" :options="chartOptions" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import {
  capitalize,
  formatCount,
  formatDay,
  useCounterHours,
  type CounterDetailedStats,
  type CounterRef,
  type DayHours,
  type LiveDay,
  type SelectedDay,
} from '~/composables/useCounterDetailedStats';

const props = defineProps<{
  counter: CounterRef;
  title: string;
  unit?: string;
  stats: CounterDetailedStats;
  liveDays?: LiveDay[] | null;
  days: SelectedDay[];
}>();

const emit = defineEmits<{ add: [day: string]; remove: [day: string] }>();

type TooltipContext = {
  points?: { y: number | null; point: { index: number }; series: { name: string; color: string } }[];
};

const loadHours = useCounterHours(props.counter);
const hoursByDay = ref<Record<string, DayHours | null>>({});

const record = computed(() => props.stats.records.allTime);

const latestDay = computed(() => {
  const liveDays = (props.liveDays ?? []).map((live) => live.day);
  return [props.stats.lastDay, ...liveDays].sort().at(-1);
});

watch(
  () => props.days.map((selected) => selected.day),
  async (days) => {
    const missing = days.filter((day) => !(day in hoursByDay.value));
    if (missing.length === 0) {
      return;
    }

    const loaded = await loadHours(missing).catch(() => [] as DayHours[]);
    const next = { ...hoursByDay.value };
    for (const day of missing) {
      next[day] = loaded.find((hours) => hours.day === day) ?? null;
    }
    hoursByDay.value = next;
  },
  { immediate: true },
);

function dayLabel(day: string): string {
  return formatDay(day, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function onDateChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.value) {
    emit('add', input.value);
    input.value = '';
  }
}

const chartOptions = computed(() => ({
  chart: { type: 'line', height: 320 },
  lang: { locale: 'fr-FR' },
  title: { text: props.title },
  credits: { enabled: false },
  xAxis: {
    categories: Array.from({ length: 24 }, (_, hour) => `${hour}h`),
    tickInterval: 2,
    crosshair: true,
  },
  yAxis: { min: 0, title: { text: `${capitalize(props.unit ?? 'passages')} / heure` } },
  tooltip: {
    shared: true,
    formatter(this: TooltipContext) {
      const points = (this.points ?? []).filter((p) => p.y !== null);
      const hour = points[0]?.point.index ?? 0;
      const rows = points.map(
        (p) => `<span style="color:${p.series.color}">●</span> ${p.series.name} : <b>${formatCount(p.y ?? 0)}</b>`,
      );
      return [`<b>${hour}h – ${hour + 1}h</b>`, ...rows].join('<br/>');
    },
  },
  plotOptions: {
    line: { lineWidth: 2, marker: { enabled: false, symbol: 'circle' } },
  },
  series: props.days.map(({ day, color }) => {
    const hours = hoursByDay.value[day];
    return {
      name: `${dayLabel(day)}${hours?.partial ? ' (en cours)' : ''}`,
      color,
      data: hours?.hourly ?? [],
    };
  }),
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
