<template>
  <div
    v-if="(stat.unsatisfactoryDistance > 0 && !stat.postponed) || stat.dangerCount > 0"
    class="my-5 not-prose p-4 bg-[#F9FAFB]"
  >
    <div class="sm:flex justify-between">
      <div v-if="stat.unsatisfactoryDistance > 0 && !stat.postponed" class="text-base font-normal text-gray-900">
        <span class="italic">Au total, </span>

        ({{ displayPercent(stat.percent) }})
        <span class="italic">
          <NuxtLink :to="stat.unsatisfactoryLink" class="italic no-underline relative inline-block animated-underline">
            <span class="text-lvv-pink font-bold">{{
              displayDistanceInKm(stat.unsatisfactoryDistance, precision)
            }}</span>
            {{ stat.unsatisfactoryDistance < 2 * 1000 ? 'est non satisfaisant' : 'sont non satisfaisants' }}
          </NuxtLink>
        </span>
      </div>
      <div v-if="stat.dangerCount > 0" class="text-base font-normal text-gray-900">
        <span class="text-lvv-pink font-bold">{{ stat.dangerCount }}</span>
        <span class="italic">{{
          stat.dangerCount <= 1 ? ' zone problématique subsiste' : ' zones problématiques subsistent'
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
const { getStatsQuality, displayDistanceInKm, displayPercent } = useStats();

const { voies, precision = 0 } = defineProps<{
  voies: Collections['voiesCyclablesGeojson'][];
  precision?: number;
}>();

const stat = getStatsQuality(voies);
</script>

<style scoped>
.animated-underline {
  position: relative;
}

.animated-underline::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background-color: #c84271;
  transform: scaleX(0);
  transform-origin: bottom right;
  transition: transform 0.3s ease-out;
}

.animated-underline:hover::after {
  transform: scaleX(1);
  transform-origin: bottom left;
}
</style>
