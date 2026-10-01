<template>
  <div class="flex items-center gap-2 mt-6">
    <label :for="id" class="text-xs text-gray-500 whitespace-nowrap lg:text-sm">Période</label>
    <select
      :id="id"
      v-model="period"
      class="text-xs border border-gray-300 rounded-md shadow-sm focus:ring-lvv-blue-600 focus:border-lvv-blue-600 py-1 pl-2 pr-6"
    >
      <option v-for="option in STATS_PERIOD_OPTIONS" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
      <option v-for="year in years" :key="year" :value="year">
        {{ year }}{{ year === currentYear ? ' (en cours)' : '' }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { STATS_PERIOD_OPTIONS, type StatsPeriod } from '~/composables/useCounterDetailedStats';

defineProps<{ years: number[]; currentYear: number | null }>();

const period = defineModel<StatsPeriod>({ required: true });
const id = useId();
</script>
