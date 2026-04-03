<template>
  <div>
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        :class="[
          'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
          mode === 'monthly' ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ]"
        @click="mode = 'monthly'"
      >
        36 derniers mois
      </button>
      <button
        :class="[
          'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
          mode === 'single' ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ]"
        @click="mode = 'single'"
      >
        Par mois
      </button>
    </div>

    <!-- Single month mode: dropdown + grouped bar chart -->
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

    <!-- 36 months line chart -->
    <template v-else>
      <ClientOnly>
        <highcharts :options="monthlyChartOptions" />
      </ClientOnly>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';

const props = defineProps<{
  name: string;
  data: { month: string; veloCount: number; voitureCount: number }[];
}>();

const mode = ref<'monthly' | 'single'>('monthly');

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

const lastRecord = props.data[props.data.length - 1];
const lastRecordMonth = lastRecord ? new Date(lastRecord.month).getMonth() : 0;
const selectedMonth = ref(months.find((m) => m.value === lastRecordMonth)!);

const singleMonthChartOptions = computed(() => {
  const filtered = props.data
    .filter((item) => new Date(item.month).getMonth() === selectedMonth.value.value)
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  const categories = filtered.map((item) =>
    new Date(item.month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
  );

  return {
    chart: { type: 'column', height: 400 },
    title: { text: `${props.name} - ${selectedMonth.value.name}` },
    credits: { enabled: false },
    xAxis: { categories, labels: { autoRotation: [-45], style: { fontSize: '10px' } } },
    yAxis: { min: 0, title: { text: 'Passages' } },
    tooltip: { shared: true, valueSuffix: ' passages' },
    plotOptions: {
      column: { pointPadding: 0.1, borderWidth: 0, groupPadding: 0.15 },
      series: { dataLabels: { enabled: true } },
    },
    series: [
      {
        name: 'Vélos',
        color: '#C84271',
        data: filtered.map((item) => item.veloCount),
      },
      {
        name: 'Voitures',
        color: '#152B68',
        data: filtered.map((item) => item.voitureCount),
      },
    ],
    responsive: {
      rules: [
        {
          condition: { maxWidth: 500 },
          chartOptions: {
            yAxis: { title: { text: undefined } },
            plotOptions: { series: { dataLabels: { enabled: false } } },
          },
        },
      ],
    },
  };
});

const monthlyChartOptions = computed(() => {
  const recent = props.data
    .slice()
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .slice(-36);

  const categories = recent.map((item) =>
    new Date(item.month).toLocaleString('fr-FR', { month: 'short', year: '2-digit' }),
  );

  return {
    chart: { type: 'line', height: 400 },
    title: { text: `Évolution mensuelle - ${props.name}` },
    credits: { enabled: false },
    xAxis: {
      categories,
      labels: { autoRotation: [-45], style: { fontSize: '10px' } },
    },
    yAxis: { min: 0, title: { text: 'Passages' } },
    tooltip: { shared: true, crosshairs: true, valueSuffix: ' passages' },
    plotOptions: { line: { marker: { radius: 2 } } },
    series: [
      {
        name: 'Vélos',
        color: '#C84271',
        data: recent.map((item) => item.veloCount),
      },
      {
        name: 'Voitures',
        color: '#152B68',
        data: recent.map((item) => item.voitureCount),
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
