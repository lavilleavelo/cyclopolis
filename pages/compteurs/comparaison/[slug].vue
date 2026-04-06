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
        :options="{ roundedCorners: true, legend: false, filter: false, cooperativeGestures: true }"
        class="mt-6"
        style="height: 40vh"
      />
    </ClientOnly>

    <CounterMaintenanceBanner :counts="veloCounter.counts" />

    <div class="mt-6 flex flex-wrap justify-center gap-3">
      <NuxtLink
        :to="veloCounter.path"
        class="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors text-lvv-pink font-medium text-sm no-underline"
      >
        <Icon name="fluent:vehicle-bicycle-16-regular" class="text-lg" />
        Voir le compteur vélo
      </NuxtLink>
      <NuxtLink
        v-if="voitureCounter"
        :to="voitureCounter.path"
        class="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-lvv-blue-600 font-medium text-sm no-underline"
      >
        <Icon name="fluent:vehicle-car-profile-ltr-16-regular" class="text-lg" />
        Voir le compteur voiture
      </NuxtLink>
    </div>

    <h2>Fréquentation annuelle</h2>
    <p>Comparaison du nombre total de passages par année entre les vélos et les voitures sur cet axe.</p>
    <ChartComparisonHistogram :data="data" :name="veloCounter.name" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" />

    <h2>Répartition vélo / voiture</h2>
    <p>
      Évolution de la part relative des vélos et des voitures chaque année. Ce graphique permet de visualiser le
      rééquilibrage entre les deux modes de transport.
    </p>
    <ChartComparisonShare :data="data" :name="veloCounter.name" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" />

    <h2>Trafic cumulé</h2>
    <p>
      Volume total de passages (vélos + voitures) par année, permettant de visualiser l'évolution globale du trafic sur
      cet axe.
    </p>
    <ChartComparisonCumulative :data="data" :name="veloCounter.name" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" />

    <h2>Évolution mensuelle</h2>
    <p>Comparaison mois par mois de la fréquentation vélo et voiture.</p>
    <ChartComparisonMonthly :data="data" :name="veloCounter.name" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" />

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
    isMixed: true,
  });
});
</script>
