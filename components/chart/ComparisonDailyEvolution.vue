<template>
  <div>
    <div class="flex flex-wrap justify-between items-start gap-2 mb-4">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="range in RANGES"
          :key="range.label"
          :class="[
            'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
            selectedDays === range.days ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
          @click="selectedDays = range.days"
        >
          {{ range.label }}
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
  capitalize,
  dayToTimestamp,
  formatCount,
  formatDay,
  formatPercent,
  type CounterDetailedStats,
} from '~/composables/useCounterDetailedStats';
import { useQueryParam, valuesQueryParam } from '~/composables/useQueryParam';

const RANGES = [
  { label: '3 mois', days: 91 },
  { label: '1 an', days: 365 },
  { label: '3 ans', days: 3 * 365 },
  { label: 'Tout', days: null },
];
const DAY_MS = 24 * 60 * 60 * 1000;
const ROLLING_DAYS = 7;
const MIN_ROLLING_VALUES = 4;
const SCHOOL_HOLIDAY_BAND_COLOR = 'rgba(79, 143, 214, 0.15)';
const MIN_LABELLED_HOLIDAY_DAYS = 7;
const MAX_LABELLED_RANGE_DAYS = 365;

const props = defineProps<{
  title: string;
  velo: CounterDetailedStats;
  voiture: CounterDetailedStats;
  selectedDay?: string | null;
}>();

const emit = defineEmits<{ selectDay: [day: string] }>();

const selectedDays = ref<number | null>(365);
const mode = ref<'count' | 'share'>('count');
const showSchoolHolidays = ref(true);
useQueryParam(
  'journalier-plage',
  selectedDays,
  valuesQueryParam<number | null>({ '3m': 91, '1a': 365, '3a': 3 * 365, tout: null }),
);
useQueryParam('journalier', mode, valuesQueryParam({ passages: 'count', part: 'share' }));
useQueryParam('journalier-vacances', showSchoolHolidays, valuesQueryParam({ 1: true, 0: false }));

type Point = [number, number | null];
type TooltipContext = { x: number };

function countsByTimestamp(stats: CounterDetailedStats): Map<number, number> {
  const start = dayToTimestamp(stats.daily.start);
  const counts = new Map<number, number>();
  stats.daily.values.forEach((value, index) => {
    if (value !== null) {
      counts.set(start + index * DAY_MS, value);
    }
  });
  return counts;
}

function average(values: number[]): number | null {
  return values.length >= MIN_ROLLING_VALUES
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null;
}

function toDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

const series = computed(() => {
  const velo = countsByTimestamp(props.velo);
  const voiture = countsByTimestamp(props.voiture);
  const first = Math.max(dayToTimestamp(props.velo.daily.start), dayToTimestamp(props.voiture.daily.start));
  const last = Math.min(dayToTimestamp(props.velo.lastDay), dayToTimestamp(props.voiture.lastDay));
  const veloRolling: Point[] = [];
  const voitureRolling: Point[] = [];
  const shareRolling: Point[] = [];
  const window: { velo?: number; voiture?: number }[] = [];

  for (let x = first; x <= last; x += DAY_MS) {
    window.push({ velo: velo.get(x), voiture: voiture.get(x) });
    if (window.length > ROLLING_DAYS) {
      window.shift();
    }
    const both = window.filter((day) => day.velo !== undefined && day.voiture !== undefined);
    const bikes = both.reduce((sum, day) => sum + day.velo!, 0);
    const cars = both.reduce((sum, day) => sum + day.voiture!, 0);
    veloRolling.push([x, average(window.flatMap((day) => (day.velo === undefined ? [] : [day.velo])))]);
    voitureRolling.push([x, average(window.flatMap((day) => (day.voiture === undefined ? [] : [day.voiture])))]);
    shareRolling.push([
      x,
      both.length >= MIN_ROLLING_VALUES && bikes + cars > 0 ? Math.round((bikes / (bikes + cars)) * 1000) / 10 : null,
    ]);
  }

  return { velo, voiture, veloRolling, voitureRolling, shareRolling, lastTimestamp: last };
});

const chartOptions = computed(() => {
  const { velo, voiture, veloRolling, voitureRolling, shareRolling, lastTimestamp } = series.value;
  const { schoolHolidays } = props.velo.daily;
  const isShare = mode.value === 'share';
  const showHolidayLabels = selectedDays.value !== null && selectedDays.value <= MAX_LABELLED_RANGE_DAYS;
  const rollingAt = (points: Point[], x: number) => points.find(([timestamp]) => timestamp === x)?.[1] ?? null;

  return {
    chart: { height: 380, zooming: { type: 'x', mouseWheel: { enabled: false } } },
    lang: { locale: 'fr-FR', resetZoom: 'Réinitialiser le zoom' },
    title: { text: props.title },
    credits: { enabled: false },
    xAxis: {
      type: 'datetime',
      min: selectedDays.value ? lastTimestamp - selectedDays.value * DAY_MS : undefined,
      max: lastTimestamp + DAY_MS / 2,
      crosshair: true,
      plotLines: props.selectedDay
        ? [{ value: dayToTimestamp(props.selectedDay), color: '#6B7280', width: 1, zIndex: 3 }]
        : [],
      plotBands: (showSchoolHolidays.value ? schoolHolidays : []).map((holiday) => {
        const from = dayToTimestamp(holiday.start) - DAY_MS / 2;
        const to = dayToTimestamp(holiday.end) - DAY_MS / 2;
        const labelled = showHolidayLabels && to - from >= MIN_LABELLED_HOLIDAY_DAYS * DAY_MS;
        return {
          from,
          to,
          color: SCHOOL_HOLIDAY_BAND_COLOR,
          label: labelled
            ? {
                text: holiday.name.replace(/^Vacances (de la |de |d')/, ''),
                y: 12,
                style: { color: '#6B7280', fontSize: '10px', textOverflow: 'none', whiteSpace: 'nowrap' },
              }
            : undefined,
        };
      }),
    },
    yAxis: {
      min: 0,
      title: { text: isShare ? 'Part du vélo' : 'Passages / jour' },
      labels: { format: isShare ? '{value} %' : '{value}' },
    },
    tooltip: {
      shared: true,
      formatter(this: TooltipContext) {
        const day = toDay(this.x);
        const schoolHoliday = schoolHolidays.find((holiday) => day >= holiday.start && day < holiday.end);
        const date = formatDay(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const bikes = velo.get(this.x);
        const cars = voiture.get(this.x);
        const lines = [`<b>${capitalize(date)}</b>`];
        if (schoolHoliday) {
          lines.push(schoolHoliday.name);
        }
        lines.push(
          `<span style="color:${VELO_COLOR}">●</span> Vélos : <b>${bikes === undefined ? '–' : formatCount(bikes)}</b> (moyenne sur 7 jours : ${formatCount(rollingAt(veloRolling, this.x) ?? 0)})`,
          `<span style="color:${VOITURE_COLOR}">●</span> Voitures : <b>${cars === undefined ? '–' : formatCount(cars)}</b> (moyenne sur 7 jours : ${formatCount(rollingAt(voitureRolling, this.x) ?? 0)})`,
          `Part du vélo sur 7 jours : <b>${formatPercent(rollingAt(shareRolling, this.x))}</b>`,
        );
        return lines.join('<br/>');
      },
    },
    plotOptions: {
      series: {
        turboThreshold: 0,
        cursor: 'pointer',
        point: {
          events: {
            click(this: { x: number }) {
              emit('selectDay', toDay(this.x));
            },
          },
        },
      },
      line: { lineWidth: 2, marker: { enabled: false } },
    },
    series: [
      ...(isShare
        ? [{ type: 'line', name: 'Part du vélo (moyenne sur 7 jours)', color: VELO_COLOR, data: shareRolling }]
        : [
            { type: 'line', name: 'Vélos (moyenne sur 7 jours)', color: VELO_COLOR, data: veloRolling },
            { type: 'line', name: 'Voitures (moyenne sur 7 jours)', color: VOITURE_COLOR, data: voitureRolling },
          ]),
      {
        type: 'column',
        name: 'Vacances scolaires',
        showInLegend: schoolHolidays.length > 0,
        visible: showSchoolHolidays.value,
        color: SCHOOL_HOLIDAY_BAND_COLOR,
        enableMouseTracking: false,
        events: {
          legendItemClick: () => {
            showSchoolHolidays.value = !showSchoolHolidays.value;
            return false;
          },
        },
        data: [],
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
  };
});
</script>
