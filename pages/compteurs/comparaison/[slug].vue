<template>
  <ContentFrame
    v-if="veloCounter"
    header="Fréquentation vélo & voiture"
    :title="veloCounter.name"
    :sub-title="veloCounter.arrondissement"
    description=""
  >
    <h2>Total des passages par année</h2>
    <p>
      Comparaison de la fréquentation annuelle entre les vélos et les voitures. Ceci est possible grâce à la présence de
      compteurs automatiques sur les différentes voies.
    </p>
    <ChartLine :data="data" :name="veloCounter.name" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" />

    <h2>Source des données</h2>
    <p>
      Les données des compteurs vélo proviennent de
      <a href="https://data.eco-counter.com/ParcPublic/?id=3902#" target="_blank">data.eco-counter.com</a>.
    </p>
    <p>
      Les données des compteurs voiture proviennent du
      <a href="https://avatar.cerema.fr/cartographie" target="_blank">cerema</a>.
    </p>
  </ContentFrame>
</template>

<script setup lang="ts">
import type { Count } from '~/types';

const { params } = useRoute();

const { data: veloCounter } = await useAsyncData(`/compteurs/velo/${params.slug}`, () => {
  return queryCollection('compteurs')
    .where('path', 'LIKE', '/compteurs/velo%')
    .where('cyclopolisId', '=', params.slug)
    .first();
});

const { data: voitureCounter } = await useAsyncData(`/compteurs/voiture/${params.slug}`, () => {
  return queryCollection('compteurs')
    .where('path', 'LIKE', '/compteurs/voiture%')
    .where('cyclopolisId', '=', params.slug)
    .first();
});

if (!veloCounter.value || !voitureCounter.value) {
  const router = useRouter();
  router.push({ path: '/404' });
}

const data = computed(() => {
  if (!voitureCounter.value || !veloCounter.value) return [];

  return voitureCounter.value.counts.map((voitureCount: Count) => {
    const veloCount = veloCounter.value?.counts.find((veloCount: Count) => veloCount.month === voitureCount.month);
    return {
      month: voitureCount.month,
      veloCount: veloCount?.count || 0,
      voitureCount: voitureCount.count
    };
  });
});

// const graphTitles = {
//   totalByYear: `Fréquentation cycliste annuelle - ${counter.value.name}`,
//   monthComparison: `Fréquentation cycliste - ${counter.value.name}`
// };

// const features = getCompteursFeatures({ counters: [counter.value], type: 'compteur-velo' });

// const DESCRIPTION = `Compteur vélo ${counter.value.name}`;
// const IMAGE_URL = counter.value.imageUrl;
// useHead({
//   meta: [
//     // description
//     { hid: 'description', name: 'description', content: DESCRIPTION },
//     { hid: 'og:description', property: 'og:description', DESCRIPTION },
//     { hid: 'twitter:description', name: 'twitter:description', DESCRIPTION },
//     // cover image
//     { hid: 'og:image', property: 'og:image', content: IMAGE_URL },
//     { hid: 'twitter:image', name: 'twitter:image', content: IMAGE_URL }
//   ]
// });
</script>
