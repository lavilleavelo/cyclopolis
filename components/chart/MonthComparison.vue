<template>
  <div>
    <div class="flex flex-wrap gap-2 mb-4">
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

    <!-- Single month mode: month dropdown + bar chart -->
    <template v-if="mode === 'single'">
      <Listbox v-model="selectedMonth" class="w-72 z-20">
        <div class="relative mt-1">
          <ListboxButton
            class="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
          >
            <span class="block truncate">{{ selectedMonth.name }}</span>
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <Icon name="mdi:chevron-down" class="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </ListboxButton>

          <transition
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <ListboxOptions
              class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm list-none list-outside pl-0"
            >
              <ListboxOption
                v-for="month in months"
                v-slot="{ active, selected }"
                :key="month.name"
                :value="month"
                as="template"
              >
                <li
                  :class="[
                    active ? 'bg-lvv-blue-300 text-lvv-blue-400' : 'text-gray-900',
                    'relative cursor-default select-none py-2 pl-10 pr-4',
                  ]"
                >
                  <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">{{ month.name }}</span>
                  <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-lvv-blue-600">
                    <Icon name="mdi:check" class="h-5 w-5" aria-hidden="true" />
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </div>
      </Listbox>

      <ClientOnly>
        <highcharts :options="singleMonthChartOptions" class="mt-8" />
      </ClientOnly>
    </template>

    <!-- Multi-year overlay mode: line chart -->
    <template v-else>
      <div class="flex items-center gap-2 mt-2">
        <label for="year-count" class="text-sm text-gray-600">Nombre d'années :</label>
        <select
          id="year-count"
          v-model="selectedYearCount"
          class="rounded-md border-gray-300 shadow-sm text-sm py-1 pl-2 pr-8"
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
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import type { Count } from '~/types';

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Object, required: true },
});

const mode = ref<'single' | 'multi'>('single');

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
const selectedMonth = ref(months.find((month) => month.value === lastRecordMonth)!);

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
    .filter((count: Count) => new Date(count.month).getMonth() === selectedMonth.value.value)
    .sort((a: Count, b: Count) => new Date(a.month).getTime() - new Date(b.month).getTime());
});

const singleMonthYears = computed(() => {
  return singleMonthCounts.value.map((count: Count) =>
    new Date(count.month).toLocaleString('fr-Fr', { month: 'long', year: 'numeric' }),
  );
});

const singleMonthChartOptions = computed(() => {
  const values = singleMonthCounts.value.map((count: Count) => count.count);
  const max = Math.max(...values);

  return {
    chart: { type: 'column' },
    title: { text: `${props.title} - ${selectedMonth.value.name}` },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: { categories: singleMonthYears.value },
    yAxis: { min: 0, title: { text: 'Fréquentation' } },
    plotOptions: {
      column: { pointPadding: 0.2, borderWidth: 0 },
      series: {
        dataLabels: { enabled: true },
      },
    },
    series: [
      {
        name: 'fréquentation',
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
        return found ? found.count : null;
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
    yAxis: { min: 0, title: { text: 'Passages' } },
    tooltip: {
      shared: true,
      crosshairs: true,
      valueSuffix: ' passages',
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
