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
          mode === 'yearly' ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ]"
        @click="mode = 'yearly'"
      >
        Par année
      </button>
      <div v-if="mode === 'monthly'" class="flex items-center gap-2 ml-2">
        <label for="year-count-share" class="text-sm text-gray-600">Années :</label>
        <select
          id="year-count-share"
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
  </div>
</template>

<script setup lang="ts">
import { addShareChartIcons, destroyChartIcons } from '~/helpers/chartIcons';

const props = defineProps<{
  name: string;
  data: { month: string; veloCount: number; voitureCount: number }[];
}>();

const mode = ref<'yearly' | 'monthly'>('monthly');

const allYears = [...new Set(props.data.map((item) => new Date(item.month).getFullYear()))].sort();
const selectedYearCount = ref(Math.min(3, allYears.length));
const yearCountOptions = computed(() => {
  const options: number[] = [];
  for (let i = 2; i <= allYears.length; i++) {
    options.push(i);
  }
  return options;
});

function toPct(velo: number, voiture: number) {
  const total = velo + voiture;
  return {
    veloPct: total > 0 ? Math.round((velo / total) * 1000) / 10 : 0,
    voiturePct: total > 0 ? Math.round((voiture / total) * 1000) / 10 : 0,
  };
}

const chartOptions = computed(() => {
  if (mode.value === 'monthly') {
    const monthCount = selectedYearCount.value * 12;
    const recent = props.data
      .slice()
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-monthCount);

    const categories = recent.map((item) =>
      new Date(item.month).toLocaleString('fr-FR', { month: 'short', year: '2-digit' }),
    );
    const pctData = recent.map((item) => toPct(item.veloCount, item.voitureCount));

    return buildChart(
      categories,
      pctData.map((d) => d.veloPct),
      pctData.map((d) => d.voiturePct),
      `Répartition mensuelle - ${props.name}`,
      'monthly',
    );
  }

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
    .map(([year, { velo, voiture }]) => ({ year: parseInt(year), ...toPct(velo, voiture) }))
    .sort((a, b) => a.year - b.year);

  return buildChart(
    sorted.map((d) => d.year),
    sorted.map((d) => d.veloPct),
    sorted.map((d) => d.voiturePct),
    `Répartition annuelle - ${props.name}`,
    'yearly',
  );
});

function buildChart(
  categories: (string | number)[],
  veloPct: number[],
  voiturePct: number[],
  title: string,
  chartMode: 'monthly' | 'yearly',
) {
  return {
    chart: {
      type: 'area',
      height: 400,
      events: {
        render(this) {
          destroyChartIcons(this);
          addShareChartIcons(this, chartMode);
        },
      },
    },
    title: { text: title },
    credits: { enabled: false },
    xAxis: {
      categories,
      labels: { autoRotation: [-45], style: { fontSize: '10px' } },
    },
    yAxis: {
      min: 0,
      max: 100,
      title: { text: 'Part (%)' },
      labels: { format: '{value}%' },
    },
    tooltip: {
      pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}%</b><br/>',
      shared: true,
    },
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
      { name: 'Voitures', color: '#152B68', data: voiturePct },
      { name: 'Vélos', color: '#C84271', data: veloPct },
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
}
</script>
