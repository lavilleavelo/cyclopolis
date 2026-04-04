<template>
  <div>
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <button
        :class="[
          'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
          mode === 'monthly' ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ]"
        @click="mode = 'monthly'"
      >
        Par mois
      </button>
      <button
        :class="[
          'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
          mode === 'rolling' ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ]"
        @click="mode = 'rolling'"
      >
        12 mois glissants
      </button>
      <div v-if="mode === 'monthly'" class="flex items-center gap-2 ml-2">
        <label for="year-count-cumulative" class="text-sm text-gray-600">Années :</label>
        <select
          id="year-count-cumulative"
          v-model="selectedYearCount"
          class="rounded-md border-gray-300 shadow-sm text-sm py-1 pl-2 pr-8"
        >
          <option v-for="n in yearCountOptions" :key="n" :value="n">
            {{ n === allYears.length ? `Toutes (${n})` : n }}
          </option>
        </select>
      </div>
    </div>
    <ClientOnly>
      <highcharts :options="chartOptions" />
    </ClientOnly>
    <p v-if="mode === 'rolling'" class="mt-2 text-sm text-gray-500 italic">
      Chaque point représente le total des passages de {{ rollingStartMonthLabel }} à {{ latestMonthLabel }} (12 mois
      glissants).
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string;
  data: { month: string; veloCount: number; voitureCount: number }[];
}>();

const mode = ref<'monthly' | 'rolling'>('monthly');

const allYears = [...new Set(props.data.map((item) => new Date(item.month).getFullYear()))].sort();
const selectedYearCount = ref(Math.min(3, allYears.length));
const yearCountOptions = computed(() => {
  const options: number[] = [];
  for (let i = 2; i <= allYears.length; i++) {
    options.push(i);
  }
  return options;
});

const lastRecord = props.data[props.data.length - 1]!;
const latestDate = new Date(lastRecord.month);
const latestMonth = latestDate.getMonth();
const latestMonthLabel = latestDate.toLocaleString('fr-FR', { month: 'long' });
const rollingStartMonthLabel = new Date(latestDate.getFullYear(), latestMonth + 1, 1).toLocaleString('fr-FR', {
  month: 'long',
});

function getMonthlyData() {
  const monthCount = selectedYearCount.value * 12;
  const recent = props.data
    .slice()
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .slice(-monthCount);

  return {
    categories: recent.map((item) => new Date(item.month).toLocaleString('fr-FR', { month: 'short', year: '2-digit' })),
    velo: recent.map((item) => item.veloCount),
    voiture: recent.map((item) => item.voitureCount),
    rotateLabels: true,
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
    rotateLabels: false,
  };
}

const chartOptions = computed(() => {
  const d = mode.value === 'monthly' ? getMonthlyData() : getRollingData();

  const titleSuffix =
    mode.value === 'monthly'
      ? ` (${selectedYearCount.value === allYears.length ? 'toutes les années' : `${selectedYearCount.value} dernières années`})`
      : ' (12 mois glissants)';

  return {
    chart: { type: 'area', height: 400 },
    title: { text: `Trafic cumulé - ${props.name}${titleSuffix}` },
    credits: { enabled: false },
    xAxis: {
      categories: d.categories,
      labels: { autoRotation: [-45], style: { fontSize: '10px' } },
    },
    yAxis: { min: 0, title: { text: 'Passages' } },
    tooltip: { shared: true, valueSuffix: ' passages' },
    plotOptions: {
      area: {
        stacking: 'normal',
        lineColor: '#ffffff',
        lineWidth: 1,
        fillOpacity: 1,
        marker: { enabled: false },
      },
    },
    series: [
      { name: 'Voitures', color: '#152B68', data: d.voiture },
      { name: 'Vélos', color: '#C84271', data: d.velo },
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
