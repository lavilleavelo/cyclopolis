<template>
  <div class="inline-flex rounded-md shadow-sm" role="group">
    <button
      type="button"
      :class="[
        'px-2.5 py-1 text-xs font-medium rounded-l-md border border-gray-300 transition-colors',
        mode === 'total' ? 'bg-lvv-blue-600 text-white border-lvv-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50',
      ]"
      @click="mode = 'total'"
    >
      Total
    </button>
    <button
      type="button"
      :class="[
        'px-2.5 py-1 text-xs font-medium rounded-r-md border border-l-0 border-gray-300 transition-colors',
        mode === 'daily' ? 'bg-lvv-blue-600 text-white border-lvv-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50',
      ]"
      @click="mode = 'daily'"
    >
      /&nbsp;jour
    </button>
  </div>
</template>

<script setup lang="ts">
import { useChartDisplayMode } from '~/composables/useChartDisplayMode';

const mode = useChartDisplayMode();
</script>
