<template>
  <div v-if="(stat.distance > 0 && !stat.postponed) || stat.dangerCount > 0" class="my-5 not-prose p-4 bg-[#F9FAFB]">
    <div class="sm:flex justify-between">
      <div v-if="stat.distance > 0 && !stat.postponed" class="text-base font-normal text-gray-900">
        <span class="italic">Au total, </span>
        <span class="text-lvv-pink font-bold">{{ displayDistanceInKm(stat.distance, precision) }}</span> ({{
          displayPercent(stat.percent)
        }})
        <span class="italic">{{ stat.distance < 2 * 1000 ? 'est non satisfaisant' : 'sont non satisfaisants' }}</span>
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

const { voies, precision } = defineProps<{
  voies: Collections['voiesCyclablesGeojson'][];
  precision?: number;
}>();

const stat = getStatsQuality(voies);
</script>
