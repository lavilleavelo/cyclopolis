<template>
  <div v-if="loading" class="flex items-center justify-center h-64">
    <Icon name="svg-spinners:ring-resize" class="w-16 h-16 text-lvv-blue-600" />
  </div>

  <div v-else-if="isComparison && veloCounter && voitureCounter" class="prose prose-sm max-w-none p-4">
    <div class="text-center">
      <div class="text-base text-lvv-blue-600 font-semibold tracking-wide uppercase">Fréquentation vélo & voiture</div>
      <h2 class="mt-1 text-xl font-extrabold text-gray-900">{{ veloCounter.name }}</h2>
      <p class="text-sm text-gray-500">{{ veloCounter.arrondissement }}</p>
    </div>

    <CounterMaintenanceBanner :counts="veloCounter.counts" />

    <div class="mt-4 flex flex-wrap justify-center gap-3">
      <a
        href="#"
        class="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors text-lvv-pink font-medium text-sm no-underline"
        @click.prevent="navigateToCounter(veloCounter.path)"
      >
        <Icon name="fluent:vehicle-bicycle-16-regular" class="text-lg" />
        Voir le compteur vélo
      </a>
      <a
        href="#"
        class="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-lvv-blue-600 font-medium text-sm no-underline"
        @click.prevent="navigateToCounter(voitureCounter.path)"
      >
        <Icon name="fluent:vehicle-car-profile-ltr-16-regular" class="text-lg" />
        Voir le compteur voiture
      </a>
    </div>

    <h3>Fréquentation annuelle</h3>
    <ChartComparisonHistogram
      :data="comparisonData"
      :name="veloCounter.name"
      class="lg:p-4 lg:rounded-lg lg:shadow-md"
    />

    <h3>Répartition vélo / voiture</h3>
    <ChartComparisonShare :data="comparisonData" :name="veloCounter.name" class="lg:p-4 lg:rounded-lg lg:shadow-md" />

    <h3>Trafic cumulé</h3>
    <ChartComparisonCumulative
      :data="comparisonData"
      :name="veloCounter.name"
      class="lg:p-4 lg:rounded-lg lg:shadow-md"
    />

    <h3>Évolution mensuelle</h3>
    <ChartComparisonMonthly :data="comparisonData" :name="veloCounter.name" class="lg:p-4 lg:rounded-lg lg:shadow-md" />

    <h3>Source des données</h3>
    <p class="text-sm text-gray-500">
      Données vélo&nbsp;:
      <a href="https://data.eco-counter.com/ParcPublic/?id=3902#" target="_blank">data.eco-counter.com</a>. Données
      voiture&nbsp;: <a href="https://avatar.cerema.fr/cartographie" target="_blank">avatar.cerema.fr</a>.
    </p>
  </div>

  <div v-else-if="counter" class="prose prose-sm max-w-none p-4">
    <div class="text-center">
      <div class="text-base text-lvv-blue-600 font-semibold tracking-wide uppercase">
        {{ isVelo ? 'Compteur vélo' : 'Compteur voiture' }}
      </div>
      <h2 class="mt-1 text-xl font-extrabold text-gray-900">{{ counter.name }}</h2>
      <p class="text-sm text-gray-500">{{ counter.arrondissement }}</p>
    </div>

    <CounterMaintenanceBanner :counts="counter.counts" />

    <p v-if="counter.description" class="text-gray-500">{{ counter.description }}</p>

    <div v-if="isVelo && (counter.lines?.length || 0) > 0" class="text-center text-sm">
      Ce compteur est installé sur
      <span>la </span>
      <span v-for="(line, index) in counter.lines" :key="line">
        <LineLink :line="String(line)" anchor="overview" />
        <span v-if="index < counter.lines.length - 2">, la </span>
        <span v-else-if="index === counter.lines.length - 2"> et la </span>
      </span>
    </div>

    <div v-if="matchingCounter" class="mt-4 flex flex-wrap justify-center gap-3">
      <a
        href="#"
        class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm no-underline"
        :class="
          isVelo ? 'bg-blue-50 hover:bg-blue-100 text-lvv-blue-600' : 'bg-pink-50 hover:bg-pink-100 text-lvv-pink'
        "
        @click.prevent="navigateToCounter(matchingCounter.path)"
      >
        <Icon
          :name="isVelo ? 'fluent:vehicle-car-profile-ltr-16-regular' : 'fluent:vehicle-bicycle-16-regular'"
          class="text-lg"
        />
        {{ isVelo ? 'Voir le compteur voiture' : 'Voir le compteur vélo' }}
      </a>
      <a
        v-if="counter.cyclopolisId"
        href="#"
        class="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 font-medium text-sm no-underline"
        @click.prevent="navigateToCounter(`/compteurs/comparaison/${counter.cyclopolisId}`)"
      >
        Comparaison vélo / voiture
      </a>
    </div>

    <h3>Total des passages par année</h3>
    <ChartTotalByYear
      :title="`Fréquentation ${isVelo ? 'cycliste' : 'voiture'} annuelle - ${counter.name}`"
      :data="counter"
      class="lg:p-4 lg:rounded-lg lg:shadow-md"
    />

    <h3>Comparaison des passages</h3>
    <ChartMonthComparison
      :title="`Fréquentation ${isVelo ? 'cycliste' : 'voiture'} - ${counter.name}`"
      :data="counter"
      class="lg:p-4 lg:rounded-lg lg:shadow-md"
    />

    <h3>Source des données</h3>
    <p v-if="isVelo" class="text-sm text-gray-500">
      Les données proviennent de
      <a href="https://data.eco-counter.com/ParcPublic/?id=3902#" target="_blank">data.eco-counter.com</a>.
    </p>
    <p v-else class="text-sm text-gray-500">
      Les données proviennent de
      <a href="https://avatar.cerema.fr/cartographie" target="_blank">avatar.cerema.fr</a>.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Count } from '~/types';

const props = defineProps<{
  counterLink: string;
}>();

const router = useRouter();
const route = useRoute();

const isComparison = computed(() => props.counterLink.startsWith('/compteurs/comparaison/'));
const isVelo = computed(() => props.counterLink.startsWith('/compteurs/velo/'));

const cyclopolisId = computed(() => {
  if (isComparison.value) {
    return props.counterLink.split('/').pop() || '';
  }
  return '';
});

function navigateToCounter(path: string) {
  router.replace({ query: { ...route.query, counterLink: path } });
}

const { data: counter, pending: loadingSingle } = await useAsyncData(
  'sidebar-counter',
  () => {
    if (isComparison.value) return Promise.resolve(null);
    return queryCollection('compteurs').path(props.counterLink).first();
  },
  { watch: [() => props.counterLink] },
);

const { data: veloCounter, pending: loadingVelo } = await useAsyncData(
  'sidebar-velo',
  () => {
    if (!isComparison.value) return Promise.resolve(null);
    return queryCollection('compteurs')
      .where('path', 'LIKE', '/compteurs/velo%')
      .where('cyclopolisId', '=', cyclopolisId.value)
      .first();
  },
  { watch: [() => props.counterLink] },
);

const { data: voitureCounter, pending: loadingVoiture } = await useAsyncData(
  'sidebar-voiture',
  () => {
    if (!isComparison.value) return Promise.resolve(null);
    return queryCollection('compteurs')
      .where('path', 'LIKE', '/compteurs/voiture%')
      .where('cyclopolisId', '=', cyclopolisId.value)
      .first();
  },
  { watch: [() => props.counterLink] },
);

const { data: matchingCounter } = await useAsyncData(
  'sidebar-matching',
  () => {
    if (isComparison.value || !counter.value?.cyclopolisId) return Promise.resolve(null);
    const matchPath = isVelo.value ? '/compteurs/voiture%' : '/compteurs/velo%';
    return queryCollection('compteurs')
      .where('path', 'LIKE', matchPath)
      .where('cyclopolisId', '=', counter.value.cyclopolisId)
      .first();
  },
  { watch: [() => props.counterLink, counter] },
);

const loading = computed(() => loadingSingle.value || loadingVelo.value || loadingVoiture.value);

const comparisonData = computed(() => {
  if (!veloCounter.value || !voitureCounter.value) return [];
  return voitureCounter.value.counts.map((voitureCount: Count) => {
    const veloCount = veloCounter.value?.counts.find((vc: Count) => vc.month === voitureCount.month);
    return {
      month: voitureCount.month,
      veloCount: veloCount?.count || 0,
      voitureCount: voitureCount.count,
    };
  });
});
</script>
