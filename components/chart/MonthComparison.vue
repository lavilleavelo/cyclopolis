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
      <Listbox v-model="selectedMonth" as="div" class="w-44">
        <ListboxLabel class="block text-sm font-medium text-gray-700 mb-1">Mois</ListboxLabel>
        <div class="relative">
          <ListboxButton
            class="relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-lvv-blue-500 focus:border-lvv-blue-500 sm:text-sm"
          >
            <span class="block truncate font-medium text-gray-900">{{ selectedMonth.name }}</span>
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <Icon name="mdi:chevron-down" class="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </ListboxButton>

          <transition
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <ListboxOptions
              class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none list-none list-outside pl-0 text-sm"
            >
              <ListboxOption v-for="month in months" v-slot="{ active }" :key="month.name" :value="month" as="template">
                <li :class="['cursor-pointer select-none py-1.5 px-3 text-gray-900', active ? 'bg-gray-100' : '']">
                  {{ month.name }}
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
      <Listbox v-model="selectedYearCount" as="div" class="w-44 mt-2">
        <ListboxLabel class="block text-sm font-medium text-gray-700 mb-1">Nombre d'années</ListboxLabel>
        <div class="relative">
          <ListboxButton
            class="relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-lvv-blue-500 focus:border-lvv-blue-500 sm:text-sm"
          >
            <span class="block truncate font-medium text-gray-900">{{
              selectedYearCount === allYears.length ? `Toutes (${selectedYearCount})` : selectedYearCount
            }}</span>
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <Icon name="mdi:chevron-down" class="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </ListboxButton>
          <transition
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <ListboxOptions
              class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none list-none list-outside pl-0 text-sm"
            >
              <ListboxOption v-for="n in yearCountOptions" v-slot="{ active }" :key="n" :value="n" as="template">
                <li :class="['cursor-pointer select-none py-1.5 px-3 text-gray-900', active ? 'bg-gray-100' : '']">
                  {{ n === allYears.length ? `Toutes (${n})` : n }}
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </div>
      </Listbox>
      <ClientOnly>
        <highcharts :options="multiYearChartOptions" class="mt-4" />
      </ClientOnly>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Listbox, ListboxButton, ListboxLabel, ListboxOptions, ListboxOption } from '@headlessui/vue';
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
    new Date(count.month).toLocaleString('fr-FR', { month: 'short', year: 'numeric' }).replace('.', ''),
  );
});

const singleMonthChartOptions = computed(() => {
  const isDaily = displayMode.value === 'daily';
  const values = singleMonthCounts.value.map((count: Count) => valueFor(count));
  const max = Math.max(...values);

  return {
    chart: { type: 'column' },
    title: { text: `${props.title} - ${selectedMonth.value.name}` },
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
