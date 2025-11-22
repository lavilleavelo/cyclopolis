<template>
  <div class="not-prose w-48">
    <div class="py-1 bg-lvv-blue-600 flex flex-col items-center justify-center text-white">
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
      <div class="py-1 flex items-center justify-center text-black">
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
      <!--      <div v-if="isAbsoluteBest">-->
      <!--        <div class="my-2 mx-8 bg-lvv-pink text-sm text-white font-semibold rounded-xl px-1.5 border-black border-2">-->
      <!--          record absolu-->
      <!--        </div>-->
      <!--      </div>-->
      <!--      <div v-if="isMonthBest && !isAbsoluteBest">-->
      <!--        <div class="my-2 mx-8 bg-lvv-pink text-sm text-white font-semibold rounded-xl px-1.5 border-white border-2">-->
      <!--          record mensuel-->
      <!--        </div>-->
      <!--      </div>-->
      <!--      <div v-if="!isMonthBest && !isAbsoluteBest">-->
      <!--        <div class="my-2 mx-8 text-sm text-white font-semibold rounded-xl px-1.5 border-white border-2">-->
      <!--          aucun record-->
      <!--        </div>-->
      <!--      </div>-->
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CompteurFeature } from '~/types';

const { feature } = defineProps<{
  feature: CompteurFeature;
}>();

const title = computed(() => (feature.properties.type === 'compteur-velo' ? 'Compteur vélo' : 'Compteur voiture'));
const countIndex = ref(feature.properties.counts.length - 1);
const count = computed(() => feature.properties.counts.at(countIndex.value)!);
const isFirstMonth = computed(() => countIndex.value === 0);
const isLastMonth = computed(() => countIndex.value === feature.properties.counts.length - 1);
const humanDate = computed(() =>
  new Date(count.value.month).toLocaleString('fr-Fr', { month: 'long', year: 'numeric' }),
);
const averageDailyTraffic = computed(() => getAverageDailyTraffic(count.value));
const icon = computed(() =>
  feature.properties.type === 'compteur-velo' ? 'game-icons:dutch-bike' : 'fluent:vehicle-car-profile-ltr-16-regular',
);
// const monthBests = findMonthBests(feature.properties.counts);
// const absoluteBest = findAbsoluteBest(feature.properties.counts)!;
// const isMonthBest = computed(() => monthBests.get(new Date(count.value.month).getMonth()));
// const isAbsoluteBest = computed(() => count.value.month === absoluteBest.month);

function getAverageDailyTraffic({ month, count }: { month: string; count: number }) {
  const date = new Date(month);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.round(count / daysInMonth);
}

// function findMonthBests(counts: Array<{ month: string; count: number }>) {
//   const monthBests = new Map();
//
//   counts.forEach(count => {
//     const month = new Date(count.month).getMonth();
//
//     if (!monthBests.has(month)) {
//       monthBests.set(month, 0);
//     }
//     if (count.count > monthBests.get(month)) {
//       monthBests.set(month, count.count);
//     }
//   });
//
//   return monthBests;
// }
//
// function findAbsoluteBest(counts: Array<{ month: string; count: number }>) {
//   return counts.toSorted((a, b) => (a.count > b.count ? 1 : a.count < b.count ? -1 : 0)).at(-1);
// }

const changeMonth = (offset: number) => {
  countIndex.value += offset;
};
</script>
