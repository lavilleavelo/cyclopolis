<template>
  <ContentFrame
    v-if="data"
    header="Relevés de température à Lyon-Bron"
    :title="data.name"
    :description="data.description"
  >
    <h2>Relevés de température</h2>
    <ClientOnly>
      <highcharts :options="chartOptions" />
    </ClientOnly>
    <!-- <ChartTotalByYear :title="graphTitles.totalByYear" :data="counter" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" /> -->

    <!-- <template v-if="counter && counter.lines && counter.lines.length > 0">
      <h2>{{ getRevName() }} mesurées par ce compteur</h2>
      <ul>
        <li v-for="line in counter.lines" :key="line">
          <LineLink :line="String(line)" />
        </li>
      </ul>
    </template> -->

    <h2>Source des données</h2>
    <p>Les données proviennent de <a href="https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-quotidiennes/" target="_blank">data.gouv.fr</a>.</p>
  </ContentFrame>
</template>

<script setup>
const { path } = useRoute();

const { withoutTrailingSlash } = useUrl();

const { data } = await useAsyncData(path, () => {
  return queryCollection('compteurs')
    .path(withoutTrailingSlash(path))
    .first();
});

if (!data.value) {
  const router = useRouter();
  router.push({ path: '/404' });
}

const years = [...new Set(data.value.counts.map((item) => new Date(item.AAAAMMJJ).getFullYear()))].sort();

const count = years.map((year) => {
  return data.value.counts
    .filter((item) => new Date(item.AAAAMMJJ).getFullYear() === year)
    .reduce((acc, item) => acc + (item.TX >= 39 ? 1 : 0), 0);
});

const chartOptions = {
  chart: { type: 'column' },
  title: { text: 'Jours avec température maximale >= 39°C à Lyon-Bron' },
  credits: { enabled: false },
  legend: { enabled: false },
  xAxis: { categories: years },
  yAxis: { min: 0, title: { text: 'Nombre de jours de forte chaleur' } },
  plotOptions: {
    column: { pointPadding: 0.2, borderWidth: 0 },
    series: {
      dataLabels: {
        enabled: true
      }
    }
  },
  series: [{
    name: 'jours de forte chaleur',
    data: count.map(y => {
      const color = '#152B68';
      return { y, color, dataLabels: { color } };
    }),
  }],
  responsive: {
    rules: [
      {
        condition: { maxWidth: 500 },
        chartOptions: {
          legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom'
          },
          yAxis: { title: { text: undefined } }
        }
      }
    ]
  }
};

// const graphTitles = {
//   totalByYear: `Fréquentation cycliste annuelle - ${counter.value.name}`,
//   monthComparison: `Fréquentation cycliste - ${counter.value.name}`
// };

const DESCRIPTION = `Relevés de température à ${data.value.name}`;

useHead({
  meta: [
    // description
    { hid: 'description', name: 'description', content: DESCRIPTION },
    { hid: 'og:description', property: 'og:description', DESCRIPTION },
    { hid: 'twitter:description', name: 'twitter:description', DESCRIPTION },
    // cover image
    // { hid: 'og:image', property: 'og:image', content: IMAGE_URL },
    // { hid: 'twitter:image', name: 'twitter:image', content: IMAGE_URL }
  ]
});
</script>
