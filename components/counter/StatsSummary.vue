<template>
  <div v-if="stats.totalSinceStart > 0" class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="bg-white rounded-lg shadow-sm p-4 text-center">
      <div class="text-xs text-gray-500 uppercase tracking-wide">Moyenne / jour</div>
      <div class="text-2xl font-bold text-lvv-blue-600 mt-1">{{ formatNumber(stats.twelveMonthAverageDaily) }}</div>
      <div class="text-xs text-gray-500 mt-1">12 derniers mois</div>
    </div>
    <div class="bg-white rounded-lg shadow-sm p-4 text-center">
      <div class="text-xs text-gray-500 uppercase tracking-wide">{{ stats.latestMonthLabel }}</div>
      <div class="text-2xl font-bold text-lvv-blue-600 mt-1">{{ formatNumber(stats.latestMonthDailyAverage) }}</div>
      <div class="text-xs text-gray-500 mt-1">{{ stats.unitLabel }} / jour</div>
    </div>
    <div class="bg-white rounded-lg shadow-sm p-4 text-center">
      <div class="text-xs text-gray-500 uppercase tracking-wide">Meilleur mois</div>
      <div class="text-2xl font-bold text-lvv-pink mt-1">{{ formatNumber(stats.bestMonthDailyAverage) }}</div>
      <div class="text-xs text-gray-500 mt-1">{{ stats.bestMonthLabel }}</div>
    </div>
    <div
      v-if="stats.growthPercent !== null"
      class="group relative bg-white rounded-lg shadow-sm p-4 text-center cursor-help"
    >
      <div class="text-xs text-gray-500 uppercase tracking-wide">
        Évolution {{ stats.growthYears }} an{{ stats.growthYears > 1 ? 's' : '' }}
      </div>
      <div class="text-2xl font-bold mt-1" :class="stats.growthPercent >= 0 ? 'text-emerald-600' : 'text-red-600'">
        {{ stats.growthPercent >= 0 ? '+' : '' }}{{ stats.growthPercent.toFixed(1) }} %
      </div>
      <div class="text-xs text-gray-500 mt-1">{{ stats.growthFromYear }} → {{ stats.growthToYear }}</div>
      <div
        class="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 rounded-md bg-gray-800 px-3 py-2 text-left text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-10"
      >
        <div class="flex justify-between gap-2">
          <span>{{ stats.growthRefRangeLabel }} :</span>
          <span class="font-semibold whitespace-nowrap">{{ formatNumber(stats.growthRefTotal ?? 0) }}</span>
        </div>
        <div class="flex justify-between gap-2 mt-0.5">
          <span>{{ stats.growthRecentRangeLabel }} :</span>
          <span class="font-semibold whitespace-nowrap">{{ formatNumber(stats.growthRecentTotal ?? 0) }}</span>
        </div>
        <div class="mt-1.5 pt-1.5 border-t border-gray-600 text-[11px] text-gray-300 leading-snug">
          Comparaison sur 12 mois glissants.
        </div>
        <div
          class="absolute left-1/2 top-full -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-800"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CounterStats } from '~/composables/useCounterStats';

defineProps<{ stats: CounterStats }>();

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}
</script>
