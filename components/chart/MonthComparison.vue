<template>
  <div>
    <div class="flex flex-wrap justify-between items-start gap-2 mb-4">
      <div class="flex flex-wrap gap-2">
        <button
          :class="[
            'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
            mode === 'single' ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
          @click="mode = 'single'"
        >
          Par mois
        </button>
        <button
          :class="[
            'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
            mode === 'multi' ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
          @click="mode = 'multi'"
        >
          Évolution annuelle
        </button>
      </div>
      <ChartDisplayModeToggle />
    </div>

    <!-- Single month mode: month dropdown + bar chart -->
    <template v-if="mode === 'single'">
      <div class="flex items-center gap-2">
        <label for="month-comparison-select" class="text-xs text-gray-500 whitespace-nowrap lg:text-sm">Mois</label>
        <select
          id="month-comparison-select"
          v-model.number="selectedMonth"
          class="text-xs border border-gray-300 rounded-md shadow-sm focus:ring-lvv-blue-600 focus:border-lvv-blue-600 py-1 pl-2 pr-6"
        >
          <option v-for="month in months" :key="month.value" :value="month.value">{{ month.name }}</option>
        </select>
      </div>

      <ClientOnly>
        <highcharts :options="singleMonthChartOptions" class="mt-8" />
      </ClientOnly>
    </template>

    <!-- Multi-year overlay mode: line chart -->
    <template v-else>
      <div class="flex items-center gap-2 mt-2">
        <label for="year-count-comparison-select" class="text-xs text-gray-500 whitespace-nowrap lg:text-sm">
          Nombre d'années
        </label>
        <select
          id="year-count-comparison-select"
          v-model.number="selectedYearCount"
          class="text-xs border border-gray-300 rounded-md shadow-sm focus:ring-lvv-blue-600 focus:border-lvv-blue-600 py-1 pl-2 pr-6"
        >
          <option v-for="n in yearCountOptions" :key="n" :value="n">
            {{ n === allYears.length ? `Toutes (${n})` : n }}
          </option>
        </select>
      </div>
      <ClientOnly>
        <highcharts :options="multiYearChartOptions" class="mt-4" />
      </ClientOnly>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useChartDisplayMode } from '~/composables/useChartDisplayMode';
import type { Count } from '~/types';

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Object, required: true },
});

const mode = ref<'single' | 'multi'>('single');
const displayMode = useChartDisplayMode();

function daysInMonthOf(monthIso: string): number {
  const d = new Date(monthIso);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function valueFor(c: Count): number {
  if (displayMode.value === 'daily') {
    return Math.round(c.count / daysInMonthOf(c.month));
  }

  return c.count;
}

const months = [
  { name: 'Janvier', value: 0 },
  { name: 'Février', value: 1 },
  { name: 'Mars', value: 2 },
  { name: 'Avril', value: 3 },
  { name: 'Mai', value: 4 },
  { name: 'Juin', value: 5 },
  { name: 'Juillet', value: 6 },
  { name: 'Août', value: 7 },
  { name: 'Septembre', value: 8 },
  { name: 'Octobre', value: 9 },
  { name: 'Novembre', value: 10 },
  { name: 'Décembre', value: 11 },
];

const monthLabels = months.map((m) => m.name);

const counts: Count[] = props.data.counts;
const allYears = [...new Set(counts.map((item: Count) => new Date(item.month).getFullYear()))].sort();

const lastRecord = counts[counts.length - 1]!;
const lastRecordMonth = new Date(lastRecord.month).getMonth();
const selectedMonth = ref<number>(lastRecordMonth);
const selectedMonthName = computed(() => months[selectedMonth.value]?.name ?? '');

const defaultYearCount = Math.min(4, allYears.length);
const selectedYearCount = ref(defaultYearCount);
const yearCountOptions = computed(() => {
  const options: number[] = [];
  for (let i = 2; i <= allYears.length; i++) {
    options.push(i);
  }
  return options;
});

const singleMonthCounts = computed(() => {
  return counts
    .filter((count: Count) => new Date(count.month).getMonth() === selectedMonth.value)
    .sort((a: Count, b: Count) => new Date(a.month).getTime() - new Date(b.month).getTime());
});

const singleMonthYears = computed(() => {
  return singleMonthCounts.value.map((count: Count) =>
    new Date(count.month).toLocaleString('fr-FR', { month: 'short', year: 'numeric' }).replace('.', ''),
  );
});

const singleMonthChartOptions = computed(() => {
  const isDaily = displayMode.value === 'daily';
  const values = singleMonthCounts.value.map((count: Count) => valueFor(count));
  const max = Math.max(...values);

  return {
    chart: { type: 'column' },
    title: { text: `${props.title} - ${selectedMonthName.value}` },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: { categories: singleMonthYears.value },
    yAxis: { min: 0, title: { text: isDaily ? 'Passages / jour' : 'Fréquentation' } },
    tooltip: { valueSuffix: isDaily ? ' passages/jour' : ' passages' },
    plotOptions: {
      column: { pointPadding: 0.2, borderWidth: 0 },
      series: {
        dataLabels: { enabled: true },
      },
    },
    series: [
      {
        name: isDaily ? 'passages/jour' : 'fréquentation',
        data: values.map((y: number) => {
          const color = y === max ? '#C84271' : '#152B68';
          return { y, color, dataLabels: { color } };
        }),
      },
    ],
  };
});

const yearColors = [
  '#C84271',
  '#152B68',
  '#6B9BD2',
  '#D97706',
  '#059669',
  '#7C3AED',
  '#DC2626',
  '#2563EB',
  '#84CC16',
  '#F59E0B',
  '#EC4899',
  '#9CA3AF',
];

const multiYearChartOptions = computed(() => {
  const displayYears = allYears.slice(-selectedYearCount.value);

  const series = displayYears
    .slice()
    .reverse()
    .map((year, index) => {
      const yearCounts = counts.filter((item: Count) => new Date(item.month).getFullYear() === year);

      const data = monthLabels.map((_, monthIndex) => {
        const found = yearCounts.find((item: Count) => new Date(item.month).getMonth() === monthIndex);
        if (!found) {
          return null;
        }

        return valueFor(found);
      });

      return {
        name: String(year),
        data,
        color: yearColors[index % yearColors.length],
        lineWidth: index === 0 ? 3 : 2,
        marker: { radius: index === 0 ? 4 : 3 },
        opacity: index > 3 ? 0.5 : 1,
      };
    });

  const isDaily = displayMode.value === 'daily';
  const titleSuffix =
    selectedYearCount.value === allYears.length
      ? ' - toutes les années'
      : ` - ${selectedYearCount.value} dernières années`;

  return {
    chart: { type: 'line' },
    title: { text: `${props.title}${titleSuffix}` },
    credits: { enabled: false },
    xAxis: {
      categories: monthLabels.map((m) => m.slice(0, 4) + '.'),
    },
    yAxis: { min: 0, title: { text: isDaily ? 'Passages / jour' : 'Passages' } },
    tooltip: {
      shared: true,
      crosshairs: true,
      valueSuffix: isDaily ? ' passages/jour' : ' passages',
    },
    plotOptions: {
      line: { connectNulls: false },
      series: { dataLabels: { enabled: false } },
    },
    series,
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
