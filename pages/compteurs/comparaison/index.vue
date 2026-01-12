<template>
  <div class="relative bg-gray-50 pt-16 pb-20 px-4 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8">
    <div class="absolute inset-0">
      <div class="bg-white h-1/3 sm:h-2/3" />
    </div>
    <div class="relative max-w-7xl mx-auto">
      <div class="text-center">
        <h2 class="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">
          Comparaison de la fréquentation cycliste et automobile.
        </h2>
        <p class="mt-8 text-xl text-gray-500 leading-8">
          Cette page permet de comparer l'évolution des fréquentations cyclistes et automobiles sur un même axe.
        </p>
        <span class="text-sm text-gray-400"
          >Données&nbsp;:&nbsp;<a class="hover:underline" href="https://avatar.cerema.fr/cartographie" target="_blank"
            >avatar.cerema.fr</a
          >,
          <a class="hover:underline" href="https://data.eco-counter.com/ParcPublic/?id=3902#" target="_blank"
            >data.eco-counter.com</a
          ></span
        >
      </div>

      <ClientOnly fallback-tag="div">
        <template #fallback>
          <MapPlaceholder style="height: 40vh" additional-class="mt-12" />
        </template>
        <Map
          :features="features"
          :options="{ roundedCorners: true, legend: false, filter: false }"
          class="mt-12"
          style="height: 40vh"
        />
      </ClientOnly>

      <div class="mt-4">
        <label for="compteur" class="sr-only">Compteur</label>
        <div class="mt-1 relative rounded-md shadow-sm">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="mdi:magnify" class="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <input
            id="compteur"
            v-model="searchText"
            type="text"
            class="py-4 pl-10 pr-4 text-lg shadow-md focus:ring-lvv-blue-600 focus:border-lvv-blue-600 block w-full border-gray-900 text-gray-900 rounded-md"
            placeholder="Chercher un compteur..."
          />
        </div>
      </div>

      <div class="mt-4 max-w-7xl mx-auto grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:max-w-none">
        <CounterCard v-for="counter of counters" :key="counter.name" :counter="counter" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MapPlaceholder from '~/components/MapPlaceholder.vue';
import { removeDiacritics } from '~/helpers/helpers';

/**
 * la clé cyclopolisId sert à faire le lien entre les compteurs vélo et voiture
 * cette page compare les 2 sur un même axe, on ne s'intéresse donc qu'à ceux qui ont
 * un cyclopolisId
 */
const { data: allVeloCounters } = await useAsyncData(() => {
  return queryCollection('compteurs')
    .where('path', 'LIKE', '/compteurs/velo%')
    .where('cyclopolisId', 'IS NOT NULL')
    .all();
});

const { data: allVoitureCounters } = await useAsyncData(() => {
  return queryCollection('compteurs')
    .where('path', 'LIKE', '/compteurs/voiture%')
    .where('cyclopolisId', 'IS NOT NULL')
    .all();
});

const searchText = ref('');

const counters = computed(() => {
  if (!allVeloCounters.value) {
    return [];
  }

  return allVeloCounters.value
    .map((veloCounter) => {
      if (!veloCounter.cyclopolisId) {
        return undefined;
      }
      if (!allVoitureCounters.value) {
        return undefined;
      }

      const voitureCounter = allVoitureCounters.value.find(
        (voitureCounter) => voitureCounter.cyclopolisId === veloCounter.cyclopolisId,
      );
      if (!voitureCounter) {
        return undefined;
      }
      return {
        ...veloCounter,
        path: `/compteurs/comparaison/${veloCounter.cyclopolisId}`,
        counts: voitureCounter.counts.map((voitureCount) => {
          const veloCount = veloCounter.counts.find((veloCount) => veloCount.month === voitureCount.month);
          return {
            month: voitureCount.month,
            veloCount: veloCount?.count || 0,
            voitureCount: voitureCount.count,
          };
        }),
      };
    })
    .filter((counter): counter is NonNullable<typeof counter> => !!counter)
    .filter((counter) =>
      removeDiacritics(`${counter.arrondissement} ${counter.name}`).includes(removeDiacritics(searchText.value)),
    );
});

const { getCompteursFeatures } = useMap();
const features = computed(() => {
  return getCompteursFeatures({
    counters: counters.value,
    type: 'compteur-comparaison',
  });
});
</script>
