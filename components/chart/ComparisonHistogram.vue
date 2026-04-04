<template>
  <div>
    <ClientOnly>
      <highcharts :options="chartOptions" />
    </ClientOnly>
    <p class="mt-2 text-sm text-gray-500 italic">
      Chaque barre représente le total des passages de {{ rollingStartMonthLabel }} à {{ latestMonthLabel }} (12 mois
      glissants).
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string;
  data: { month: string; veloCount: number; voitureCount: number }[];
}>();

const lastRecord = props.data[props.data.length - 1]!;
const latestDate = new Date(lastRecord.month);
const latestMonth = latestDate.getMonth();
const latestMonthLabel = latestDate.toLocaleString('fr-FR', { month: 'long' });
const rollingStartMonthLabel = new Date(latestDate.getFullYear(), latestMonth + 1, 1).toLocaleString('fr-FR', {
  month: 'long',
});

const allYears = [...new Set(props.data.map((item) => new Date(item.month).getFullYear()))].sort();

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
  const d = getRollingData();

  return {
    chart: { type: 'column', height: 400 },
    title: { text: `Fréquentation annuelle - ${props.name} (12 mois glissants)` },
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
