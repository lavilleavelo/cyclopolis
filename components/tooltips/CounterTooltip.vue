<template>
  <div class="bg-white not-prose w-48">
    <div class="py-1 bg-lvv-blue-600 flex flex-col items-center justify-center text-center text-white">
      <div class="font-bold text-base hover:underline">
        <a :href="feature.properties.link">{{ feature.properties.name }}</a>
      </div>
      <div>{{ title }}</div>
    </div>
    <div class="divide-y">
      <div class="py-1 flex items-center justify-around bg-zinc-100">
        <div class="text-base text-black w-8">
          <Icon v-if="!isFirstMonth" name="mdi:chevron-left" class="cursor-pointer" @click="changeMonth(-1)" />
        </div>
        <div class="text-base text-black">
          {{ humanDate }}
        </div>
        <div class="text-base text-black w-8">
          <Icon v-if="!isLastMonth" name="mdi:chevron-right" class="cursor-pointer" @click="changeMonth(+1)" />
        </div>
      </div>
      <div v-if="isComparaison" class="py-1 flex items-center justify-center text-black">
        <div class="text-base font-bold">
          {{ averageDailyVeloTraffic }}
        </div>
        <div class="px-2 text-3xl flex items-center">
          <Icon name="game-icons:dutch-bike" />
        </div>
        <div class="text-left leading-3">
          <div class="font-bold">vélos/jour</div>
          <div>en moyenne</div>
        </div>
      </div>
      <div v-if="isComparaison" class="py-1 flex items-center justify-center text-black">
        <div class="text-base font-bold">
          {{ averageDailyVoitureTraffic }}
        </div>
        <div class="px-2 text-3xl flex items-center">
          <Icon name="fluent:vehicle-car-profile-ltr-16-regular" />
        </div>
        <div class="text-left leading-3">
          <div class="font-bold">voitures/jour</div>
          <div>en moyenne</div>
        </div>
      </div>
      <div v-if="!isComparaison" class="py-1 flex items-center justify-center text-black">
        <div class="text-base font-bold">
          {{ averageDailyTraffic }}
        </div>
        <div class="px-2 text-3xl flex items-center">
          <Icon :name="icon" />
        </div>
        <div class="text-left leading-3">
          <div class="font-bold">par jour</div>
          <div>en moyenne</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CompteurFeature } from '~/types';

const { feature } = defineProps<{
  feature: CompteurFeature;
}>();

const title = computed(() =>
  feature.properties.type === 'compteur-comparaison'
    ? 'Compteur traffic'
    : feature.properties.type === 'compteur-velo'
      ? 'Compteur vélo'
      : 'Compteur voiture',
);
const isComparaison = computed(() => feature.properties.type === 'compteur-comparaison');
const countIndex = ref(feature.properties.counts.length - 1);
const count = computed(() => feature.properties.counts.at(countIndex.value)!);
const isFirstMonth = computed(() => countIndex.value === 0);
const isLastMonth = computed(() => countIndex.value === feature.properties.counts.length - 1);
const humanDate = computed(() =>
  new Date(count.value.month).toLocaleString('fr-Fr', { month: 'long', year: 'numeric' }),
);
const averageDailyTraffic = computed(() => {
  if ('count' in count.value) {
    return getAverageDailyTraffic(count.value.month, count.value.count);
  }
  return 0;
});

const averageDailyVeloTraffic = computed(() => {
  if ('veloCount' in count.value) {
    return getAverageDailyTraffic(count.value.month, count.value.veloCount);
  }
  return 0;
});

const averageDailyVoitureTraffic = computed(() => {
  if ('voitureCount' in count.value) {
    return getAverageDailyTraffic(count.value.month, count.value.voitureCount);
  }
  return 0;
});

const icon = computed(() =>
  feature.properties.type === 'compteur-velo' ? 'game-icons:dutch-bike' : 'fluent:vehicle-car-profile-ltr-16-regular',
);

const numberFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

function getAverageDailyTraffic(month: string, count: number) {
  const date = new Date(month);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return numberFormatter.format(count / daysInMonth);
}

const changeMonth = (offset: number) => {
  countIndex.value += offset;
};
</script>
