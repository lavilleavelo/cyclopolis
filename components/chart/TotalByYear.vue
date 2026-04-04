<template>
  <div>
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        :class="[
          'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
          mode === 'rolling' ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ]"
        @click="mode = 'rolling'"
      >
        12 mois glissants
      </button>
      <button
        :class="[
          'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
          mode === 'ytd' ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ]"
        @click="mode = 'ytd'"
      >
        À date ({{ latestMonthLabel }})
      </button>
    </div>
    <ClientOnly>
      <highcharts :options="chartOptions" />
    </ClientOnly>
    <p v-if="mode === 'ytd'" class="mt-2 text-sm text-gray-500 italic">
      Comparaison à date : seuls les mois de janvier à {{ latestMonthLabel }} sont comptabilisés pour chaque année.
    </p>
    <p v-if="mode === 'rolling'" class="mt-2 text-sm text-gray-500 italic">
      Chaque barre représente le total des passages de {{ rollingStartMonthLabel }} à {{ latestMonthLabel }} (12 mois
      glissants).
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Count } from '~/types';

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Object, required: true },
});

const mode = ref<'ytd' | 'rolling'>('rolling');

const counts: Count[] = props.data.counts;

const lastRecord = counts[counts.length - 1]!;
const latestDate = new Date(lastRecord.month);
const latestYear = latestDate.getFullYear();
const latestMonth = latestDate.getMonth();
const latestMonthLabel = latestDate.toLocaleString('fr-FR', { month: 'long' });
const rollingStartMonthLabel = new Date(latestYear, latestMonth + 1, 1).toLocaleString('fr-FR', { month: 'long' });

const allYears = [...new Set(counts.map((item: Count) => new Date(item.month).getFullYear()))].sort();

function getYtdData() {
  const values = allYears.map((year) => {
    return counts
      .filter((item: Count) => {
        const d = new Date(item.month);
        return d.getFullYear() === year && d.getMonth() <= latestMonth;
      })
      .reduce((acc: number, item: Count) => acc + item.count, 0);
  });

  const max = Math.max(...values);

  return {
    categories: allYears,
    data: values.map((y) => {
      const color = y === max && y > 0 ? '#C84271' : '#152B68';
      return { y, color, dataLabels: { color } };
    }),
  };
}

function getRollingData() {
  const eligibleYears = allYears.filter((year) => {
    const startDate = new Date(year - 1, latestMonth + 1, 1);
    const firstDataDate = new Date(counts[0]!.month);
    return startDate >= firstDataDate;
  });

  const values = eligibleYears.map((year) => {
    const endDate = new Date(year, latestMonth, 1);
    const startDate = new Date(year - 1, latestMonth + 1, 1);

    return counts
      .filter((item: Count) => {
        const d = new Date(item.month);
        return d >= startDate && d <= endDate;
      })
      .reduce((acc: number, item: Count) => acc + item.count, 0);
  });

  const max = Math.max(...values);

  return {
    categories: eligibleYears.map((y) => `${y - 1}/${y}`),
    data: values.map((y) => {
      const color = y === max && y > 0 ? '#C84271' : '#152B68';
      return { y, color, dataLabels: { color } };
    }),
  };
}

const chartOptions = computed(() => {
  const modeData = mode.value === 'ytd' ? getYtdData() : getRollingData();

  const titleSuffix = mode.value === 'ytd' ? ` (à date - janv. à ${latestMonthLabel})` : ' (12 mois glissants)';

  return {
    chart: { type: 'column' },
    title: { text: `${props.title}${titleSuffix}` },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: { categories: modeData.categories },
    yAxis: { min: 0, title: { text: 'Passages' } },
    plotOptions: {
      column: { pointPadding: 0.2, borderWidth: 0 },
      series: {
        dataLabels: {
          enabled: true,
        },
      },
    },
    series: [
      {
        name: 'passages',
        data: modeData.data,
      },
    ],
    responsive: {
      rules: [
        {
          condition: { maxWidth: 500 },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom',
            },
            yAxis: { title: { text: undefined } },
          },
        },
      ],
    },
  };
});
</script>
