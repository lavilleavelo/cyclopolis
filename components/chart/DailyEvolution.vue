<template>
  <div>
    <div class="flex flex-wrap gap-2 mb-4">
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
    <ClientOnly>
      <highcharts :options="chartOptions" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import {
  WEEKDAY_COLOR,
  WEEKEND_COLOR,
  capitalize,
  dayToTimestamp,
  formatCount,
  formatDay,
  isWeekend,
  type CounterDetailedStats,
  type LiveDay,
  type SelectedDay,
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
const WEEKDAY_COLUMN_COLOR = '#ADB5CA';
const WEEKEND_COLUMN_COLOR = '#ECBDCD';
const PARTIAL_COLUMN_COLOR = 'rgba(21, 43, 104, 0.08)';
const SCHOOL_HOLIDAY_BAND_COLOR = 'rgba(79, 143, 214, 0.15)';
const MIN_LABELLED_HOLIDAY_DAYS = 7;
const MAX_LABELLED_RANGE_DAYS = 365;

const props = defineProps<{
  title: string;
  stats: CounterDetailedStats;
  liveDays?: LiveDay[] | null;
  highlightedDays?: SelectedDay[];
  unit?: string;
  syncUrl?: boolean;
}>();

const emit = defineEmits<{ selectDay: [day: string] }>();

const selectedDays = ref<number | null>(365);
const showSchoolHolidays = ref(true);
if (props.syncUrl) {
  useQueryParam(
    'journalier-plage',
    selectedDays,
    valuesQueryParam<number | null>({ '3m': 91, '1a': 365, '3a': 3 * 365, tout: null }),
  );
  useQueryParam('journalier-vacances', showSchoolHolidays, valuesQueryParam({ 1: true, 0: false }));
}

type Point = [number, number | null];
type TooltipContext = {
  x: number;
  points?: { y: number | null; series: { color: string; options: { id?: string } } }[];
};

const series = computed(() => {
  const { start, values: storedValues, holidays } = props.stats.daily;
  const holidaySet = new Set(holidays);
  const startTimestamp = dayToTimestamp(start);
  const weekday: Point[] = [];
  const weekend: Point[] = [];
  const rolling: Point[] = [];

  const liveDays = (props.liveDays ?? []).filter((live) => live.day > props.stats.lastDay);
  const values = [...storedValues];
  for (const live of liveDays.filter((live) => !live.partial)) {
    values[Math.round((dayToTimestamp(live.day) - startTimestamp) / DAY_MS)] = live.count;
  }
  const partialDays = liveDays.filter((live) => live.partial);
  const countByDay = new Map(partialDays.map((live) => [live.day, live.count]));

  Array.from(values, (value) => value ?? null).forEach((value, index, allValues) => {
    const x = startTimestamp + index * DAY_MS;
    const day = new Date(x).toISOString().slice(0, 10);
    if (value !== null) {
      countByDay.set(day, value);
    }
    if (isWeekend(day, holidaySet)) {
      weekend.push([x, value]);
    } else {
      weekday.push([x, value]);
    }

    const window = allValues
      .slice(Math.max(0, index - ROLLING_DAYS + 1), index + 1)
      .filter((v): v is number => v !== null);
    const average = window.reduce((sum, v) => sum + v, 0) / window.length;
    rolling.push([x, window.length >= MIN_ROLLING_VALUES ? Math.round(average) : null]);
  });

  const lastPartialDay = partialDays.at(-1);
  const lastTimestamp = Math.max(
    startTimestamp + (values.length - 1) * DAY_MS,
    lastPartialDay ? dayToTimestamp(lastPartialDay.day) : 0,
  );
  return { weekday, weekend, rolling, partialDays, countByDay, lastTimestamp };
});

const chartOptions = computed(() => {
  const { weekday, weekend, rolling, partialDays, countByDay, lastTimestamp } = series.value;
  const { schoolHolidays } = props.stats.daily;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
  const record = props.stats.records.allTime;
  const unitLabel = capitalize(props.unit ?? 'passages');
  const dense = selectedDays.value === null || selectedDays.value > RANGES[0].days!;
  const showHolidayLabels = selectedDays.value !== null && selectedDays.value <= MAX_LABELLED_RANGE_DAYS;

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
    yAxis: { min: 0, title: { text: `${unitLabel} / jour` } },
    tooltip: {
      shared: true,
      formatter(this: TooltipContext) {
        const day = new Date(this.x).toISOString().slice(0, 10);
        const schoolHoliday = schoolHolidays.find((holiday) => day >= holiday.start && day < holiday.end);
        const date = formatDay(day, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const header = day === today ? `Aujourd'hui, ${date}` : `${date.charAt(0).toUpperCase()}${date.slice(1)}`;
        const partialDay = partialDays.find((live) => live.day === day);
        const labels: Record<string, string> = {
          rolling: 'Moyenne sur 7 jours',
          partial: `${unitLabel} jusqu'à ${partialDay?.hours}h`,
        };
        const rows = (this.points ?? [])
          .filter((p) => p.y !== null && p.series.options.id !== 'record')
          .map((p) => {
            const label = labels[p.series.options.id ?? ''] ?? unitLabel;
            return `<span style="color:${p.series.color}">●</span> ${label} : <b>${formatCount(p.y ?? 0)}</b>`;
          });
        const lines = [`<b>${header}</b>`];
        if (schoolHoliday) {
          lines.push(schoolHoliday.name);
        }
        return [...lines, ...rows].join('<br/>');
      },
    },
    plotOptions: {
      series: {
        turboThreshold: 0,
        cursor: 'pointer',
        point: {
          events: {
            click(this: { x: number }) {
              emit('selectDay', new Date(this.x).toISOString().slice(0, 10));
            },
          },
        },
      },
      column: {
        grouping: false,
        pointRange: DAY_MS,
        pointPadding: dense ? 0 : 0.15,
        groupPadding: 0,
        borderWidth: 0,
        crisp: !dense,
      },
      line: { lineWidth: 2, marker: { enabled: false } },
    },
    series: [
      { id: 'weekday', type: 'column', name: 'Jours ouvrés', color: WEEKDAY_COLUMN_COLOR, data: weekday },
      { id: 'weekend', type: 'column', name: 'Weekend et jours fériés', color: WEEKEND_COLUMN_COLOR, data: weekend },
      { id: 'rolling', type: 'line', name: 'Moyenne sur 7 jours', color: WEEKDAY_COLOR, data: rolling },
      {
        id: 'partial',
        type: 'column',
        name: 'Journée en cours',
        showInLegend: partialDays.length > 0,
        color: PARTIAL_COLUMN_COLOR,
        borderColor: WEEKDAY_COLOR,
        borderWidth: 1,
        dashStyle: 'ShortDash',
        data: partialDays.map((live, index) => ({
          x: dayToTimestamp(live.day),
          y: live.count,
          dataLabels: {
            enabled: index === partialDays.length - 1,
            format: `${formatCount(live.count)} à ${live.hours}h`,
            style: { color: '#374151' },
          },
        })),
      },
      {
        id: 'schoolHolidays',
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
      {
        id: 'record',
        type: 'scatter',
        name: 'Record',
        showInLegend: false,
        enableMouseTracking: false,
        color: WEEKEND_COLOR,
        marker: { symbol: 'circle', radius: 5, fillColor: '#FFFFFF', lineWidth: 2, lineColor: WEEKEND_COLOR },
        dataLabels: {
          enabled: true,
          format: `Record : ${record ? formatCount(record.count) : ''}`,
          style: { color: '#374151' },
        },
        data: record ? [[dayToTimestamp(record.day), record.count]] : [],
      },
      {
        id: 'highlighted',
        type: 'scatter',
        name: 'Heure par heure',
        showInLegend: false,
        enableMouseTracking: false,
        marker: { symbol: 'circle', radius: 5, lineWidth: 2, lineColor: '#FFFFFF' },
        data: (props.highlightedDays ?? [])
          .filter(({ day }) => countByDay.has(day))
          .map(({ day, color }) => ({ x: dayToTimestamp(day), y: countByDay.get(day), color })),
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
