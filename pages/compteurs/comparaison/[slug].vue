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
        :fit-bounds-features="counterFeatures"
        :options="{ roundedCorners: true, legend: false, filter: false, cooperativeGestures: true }"
        class="mt-6"
        style="height: 40vh"
      />
    </ClientOnly>

    <CounterMaintenanceBanner :counts="veloCounter.counts" />

    <p
      v-for="limitation in limitations"
      :key="limitation"
      class="not-prose mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm text-gray-700"
    >
      <Icon name="mdi:information-outline" class="align-text-bottom text-gray-500" />
      {{ limitation }}
    </p>

    <CounterLinks :velo="veloCounter.path" :voiture="voitureCounter?.path" class="mt-6" />

    <ProseH2 id="frequentation-annuelle">Fréquentation annuelle</ProseH2>
    <p>Comparaison du nombre total de passages par année entre les vélos et les voitures sur cet axe.</p>
    <ChartComparisonHistogram :data="data" :name="veloCounter.name" class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md" />

    <ProseH2 id="repartition-velo-voiture">Répartition vélo / voiture</ProseH2>
    <p>
      Évolution de la part relative des vélos et des voitures chaque année. Ce graphique permet de visualiser le
      rééquilibrage entre les deux modes de transport.
    </p>
    <ChartComparisonShare
      sync-url
      :data="data"
      :name="veloCounter.name"
      class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
    />

    <ProseH2 id="trafic-cumule">Trafic cumulé</ProseH2>
    <p>
      Volume total de passages (vélos + voitures) par année, permettant de visualiser l'évolution globale du trafic sur
      cet axe.
    </p>
    <ChartComparisonCumulative
      sync-url
      :data="data"
      :name="veloCounter.name"
      class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
    />

    <ProseH2 id="evolution-mensuelle">Évolution mensuelle</ProseH2>
    <p>Comparaison mois par mois de la fréquentation vélo et voiture.</p>
    <ChartComparisonMonthly
      sync-url
      :data="data"
      :name="veloCounter.name"
      class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
    />

    <CounterComparisonDetailedStats
      v-if="voitureCounter?.idsPdc"
      :velo-id-pdc="veloCounter.idPdc"
      :voiture-ids-pdc="voitureCounter.idsPdc"
      :name="veloCounter.name"
    />

    <ProseH2 id="source-des-donnees">Source des données</ProseH2>
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

    <CounterComparisonSensors
      v-if="voitureCounter?.points?.length"
      :velo-id-pdc="veloCounter.idPdc"
      :velo-name="veloCounter.name"
      :velo-coordinates="veloCounter.coordinates"
      :voiture-ids-pdc="voitureCounter.idsPdc"
      :voiture-points="voitureCounter.points"
    />

    <CounterLinks :velo="veloCounter.path" :voiture="voitureCounter?.path" class="mt-10" />
  </ContentFrame>
</template>

<script setup lang="ts">
import type { Count } from '~/types';
import MapPlaceholder from '~/components/MapPlaceholder.vue';
import { getLine, useVoiesCyclablesGeojson } from '~/composables/useVoiesCyclables';

const { params } = useRoute();
const { geojsons: vlGeojsons } = await useVoiesCyclablesGeojson();

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

const limitations = computed(() =>
  [veloCounter.value?.limitation, voitureCounter.value?.limitation].filter((text): text is string => Boolean(text)),
);

const data = computed(() => {
  if (!voitureCounter.value || !veloCounter.value) return [];

  return voitureCounter.value.counts.flatMap((voitureCount: Count) => {
    const veloCount = veloCounter.value?.counts.find((veloCount: Count) => veloCount.month === voitureCount.month);
    if (!veloCount) {
      return [];
    }

    return [
      {
        month: voitureCount.month,
        veloCount: veloCount.count,
        voitureCount: voitureCount.count,
      },
    ];
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

const counterFeatures = computed(() => {
  return getCompteursFeatures({
    counters: counters.value,
    type: 'compteur-comparaison',
    isMixed: true,
  });
});

const features = computed(() => {
  const counterLines = veloCounter.value?.lines ?? [];
  if (!counterLines.length || !vlGeojsons.value) {
    return counterFeatures.value;
  }

  const vlFeatures = vlGeojsons.value
    .filter((geojson) => counterLines.includes(getLine(geojson)))
    .flatMap((geojson) => geojson.features);

  return [...vlFeatures, ...counterFeatures.value];
});
</script>
