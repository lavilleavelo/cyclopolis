<template>
  <div class="relative bg-gray-50 pt-16 pb-20 px-4 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8">
    <div class="absolute inset-0">
      <div class="bg-white h-1/3 sm:h-2/3" />
    </div>
    <div class="relative max-w-7xl mx-auto">
      <div class="text-center">
        <h2 class="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">
          Suivi des compteurs voiture de l'agglomération lyonnaise
        </h2>
        <ClientOnly>
          <Map :features="features" :options="{ legend: false, filter: false }" class="mt-12" style="height: 40vh" />
        </ClientOnly>
      </div>

      <!-- search bar -->
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

      <!-- liste des compteurs -->
      <div class="mt-4 max-w-7xl mx-auto grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:max-w-none">
        <CounterCard v-for="counter of counters" :key="counter.name" :counter="counter" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { removeDiacritics } from '~/helpers/helpers';

const { getCompteursFeatures } = useMap();

const { data: allCounters } = await useAsyncData(() => {
  return queryCollection('compteurs').where('path', 'LIKE', '/compteurs/voiture%').all();
});

const searchText = ref('');

const counters = computed(() => {
  if (!allCounters.value) {
    return [];
  }
  return [...allCounters.value]
    .sort((counter1, counter2) => {
      const count1 = counter1.counts.at(-1)?.count ?? 0;
      const count2 = counter2.counts.at(-1)?.count ?? 0;
      return count2 - count1;
    })
    .filter((counter) =>
      removeDiacritics(`${counter.arrondissement} ${counter.name}`).includes(removeDiacritics(searchText.value)),
    )
    .map((counter) => ({
      ...counter,
      counts: counter.counts.map((count) => ({
        month: count.month,
        voitureCount: count.count,
      })),
    }));
});

const features = getCompteursFeatures({ counters: allCounters.value, type: 'compteur-voiture' });
</script>
