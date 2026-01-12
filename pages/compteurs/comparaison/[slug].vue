<template>
  <ContentFrame
    v-if="veloCounter"
    header="Fréquentation vélo & voiture"
    :title="veloCounter.name"
    :sub-title="veloCounter.arrondissement"
    description=""
  >
    <ClientOnly fallback-tag="div">
      <template #fallback>
        <MapPlaceholder style="height: 40vh" additional-class="mt-6" />
      </template>
      <Map
        :features="features"
        :options="{ roundedCorners: true, legend: false, filter: false }"
        class="mt-6"
        style="height: 40vh"
      />
    </ClientOnly>
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
      Les données des compteurs voiture proviennent de
      <a href="https://avatar.cerema.fr/cartographie" target="_blank">avatar.cerema.fr</a>.
    </p>
    <a href="https://avatar.cerema.fr/cartographie" target="_blank">
      <img src="https://cyclopolis.lavilleavelo.org/avatar_cerema.png" alt="Logo Cerema" class="h-12" />
    </a>
  </ContentFrame>
</template>

<script setup lang="ts">
import type { Count } from '~/types';
import MapPlaceholder from '~/components/MapPlaceholder.vue';

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
      voitureCount: voitureCount.count,
    };
  });
});

const counters = computed(() => {
  return [veloCounter.value]
    .map((veloCounter) => {
      if (!veloCounter?.cyclopolisId) {
        return;
      }
      if (!voitureCounter.value) {
        return;
      }

      return {
        ...veloCounter,
        path: `/compteurs/comparaison/${veloCounter.cyclopolisId}`,
        counts: voitureCounter.value.counts.map((voitureCount) => {
          const veloCount = veloCounter.counts.find((veloCount) => veloCount.month === voitureCount.month);
          return {
            month: voitureCount.month,
            veloCount: veloCount?.count || 0,
            voitureCount: voitureCount.count,
          };
        }),
      };
    })
    .filter((counter): counter is NonNullable<typeof counter> => !!counter);
});

const { getCompteursFeatures } = useMap();

const features = computed(() => {
  return getCompteursFeatures({
    counters: counters.value,
    type: 'compteur-comparaison',
  });
});
</script>
