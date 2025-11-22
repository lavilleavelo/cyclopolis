<template>
  <div>
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
                  'relative cursor-default select-none py-2 pl-10 pr-4'
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
      <highcharts :options="chartOptions" class="mt-8" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import type { Count } from '~/types';

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Object, required: true }
});

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
  { name: 'Décembre', value: 11 }
];

const lastRecord = props.data.counts[props.data.counts.length - 1];
const lastRecordMonth = new Date(lastRecord.month).getMonth();

const selectedMonth = ref(months.find(month => month.value === lastRecordMonth));

const counts = computed(() => {
  return props.data.counts
    .filter((count: Count) => {
      const date = new Date(count.month);
      const month = date.getMonth();
      return month === selectedMonth.value!.value;
    })
    .sort((count1: Count, count2: Count) => new Date(count1.month).getTime() - new Date(count2.month).getTime());
});

const years = computed(() => {
  return counts.value.map((count: Count) =>
    new Date(count.month).toLocaleString('fr-Fr', { month: 'long', year: 'numeric' })
  );
});

const chartOptions = computed(() => {
  const countsValues = counts.value.map((count: Count) => count.count);
  const max = Math.max(...countsValues);

  return {
    chart: { type: 'column' },
    title: { text: `${props.title} - ${selectedMonth.value!.name}` },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: { categories: years.value },
    yAxis: { min: 0, title: { text: 'Fréquentation' } },
    plotOptions: {
      column: { pointPadding: 0.2, borderWidth: 0 },
      series: {
        dataLabels: {
          enabled: true
        }
      }
    },
    series: [
      {
        name: 'fréquentation',
        data: countsValues.map((y: number) => {
          const color = y === max ? '#C84271' : '#152B68';
          return { y, color, dataLabels: { color } };
        })
      }
    ]
  };
});
</script>
