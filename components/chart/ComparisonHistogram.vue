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
          mode === 'full' ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ]"
        @click="mode = 'full'"
      >
        Année complète
      </button>
    </div>
    <ClientOnly>
      <highcharts :options="chartOptions" />
    </ClientOnly>
    <p v-if="mode === 'rolling'" class="mt-2 text-sm text-gray-500 italic">
      Chaque barre représente le total des 12 mois précédant le mois de {{ latestMonthLabel }} de l'année indiquée.
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string;
  data: { month: string; veloCount: number; voitureCount: number }[];
}>();

const mode = ref<'rolling' | 'full'>('rolling');

const lastRecord = props.data[props.data.length - 1]!;
const latestDate = new Date(lastRecord.month);
const latestMonth = latestDate.getMonth();
const latestMonthLabel = latestDate.toLocaleString('fr-FR', { month: 'long' });

const allYears = [...new Set(props.data.map((item) => new Date(item.month).getFullYear()))].sort();

function getFullYearData() {
  const yearlyData = props.data.reduce(
    (acc, item) => {
      const year = new Date(item.month).getFullYear();
      if (!acc[year]) acc[year] = { velo: 0, voiture: 0 };
      acc[year].velo += item.veloCount;
      acc[year].voiture += item.voitureCount;
      return acc;
    },
    {} as Record<number, { velo: number; voiture: number }>,
  );

  const sorted = Object.entries(yearlyData)
    .map(([year, { velo, voiture }]) => ({ year: parseInt(year), velo, voiture }))
    .sort((a, b) => a.year - b.year);

  return {
    categories: sorted.map((d) => d.year),
    velo: sorted.map((d) => d.velo),
    voiture: sorted.map((d) => d.voiture),
  };
}

function getRollingData() {
  const firstDataDate = new Date(props.data[0]!.month);

  const eligibleYears = allYears.filter((year) => {
    const startDate = new Date(year - 1, latestMonth + 1, 1);
    return startDate >= firstDataDate;
  });

  const results = eligibleYears.map((year) => {
    const endDate = new Date(year, latestMonth, 1);
    const startDate = new Date(year - 1, latestMonth + 1, 1);

    const filtered = props.data.filter((item) => {
      const d = new Date(item.month);
      return d >= startDate && d <= endDate;
    });

    return {
      label: `${year - 1}/${year}`,
      velo: filtered.reduce((sum, item) => sum + item.veloCount, 0),
      voiture: filtered.reduce((sum, item) => sum + item.voitureCount, 0),
    };
  });

  return {
    categories: results.map((d) => d.label),
    velo: results.map((d) => d.velo),
    voiture: results.map((d) => d.voiture),
  };
}

const chartOptions = computed(() => {
  const d = mode.value === 'rolling' ? getRollingData() : getFullYearData();
  const titleSuffix = mode.value === 'rolling' ? ' (12 mois glissants)' : '';

  return {
    chart: { type: 'column', height: 400 },
    title: { text: `Fréquentation annuelle - ${props.name}${titleSuffix}` },
    credits: { enabled: false },
    xAxis: { categories: d.categories, labels: { autoRotation: [-45], style: { fontSize: '10px' } } },
    yAxis: { min: 0, title: { text: 'Passages' } },
    tooltip: { shared: true, valueSuffix: ' passages' },
    plotOptions: {
      column: { pointPadding: 0.1, borderWidth: 0, groupPadding: 0.15 },
      series: { dataLabels: { enabled: true } },
    },
    series: [
      { name: 'Vélos', color: '#C84271', data: d.velo },
      { name: 'Voitures', color: '#152B68', data: d.voiture },
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
</script>
