<template>
  <div>
    <ClientOnly>
      <highcharts :options="chartOptions" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string;
  data: { month: string; veloCount: number; voitureCount: number }[];
}>();

// data est déjà triée par date (mois) croissante.
const data = props.data.reduce(
  (acc, item) => {
    const year = new Date(item.month).getFullYear();
    if (!acc[year]) {
      acc[year] = { velo: 0, voiture: 0 };
    }
    acc[year].velo += item.veloCount;
    acc[year].voiture += item.voitureCount;
    return acc;
  },
  {} as Record<string, { velo: number; voiture: number }>,
);

const chartData = Object.entries(data)
  .map(([year, { velo, voiture }]) => ({
    year: parseInt(year),
    velo,
    voiture,
  }))
  .sort((a, b) => a.year - b.year);

const chartOptions = {
  title: { text: `Fréquentation vélo & voiture - ${props.name}` },
  credits: { enabled: false },
  yAxis: { title: { text: 'Passages' } },
  xAxis: { categories: chartData.map((item) => item.year) },
  series: [
    {
      name: 'Voitures',
      color: '#152B68',
      data: chartData.map((item) => item.voiture),
    },
    {
      name: 'Vélos',
      color: '#C84271',
      data: chartData.map((item) => item.velo),
    },
  ],
  responsive: {
    rules: [{ condition: { maxWidth: 500 } }],
  },
};
</script>
