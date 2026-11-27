<template>
  <div
    class="legend-inline-container bg-white rounded-lg shadow-lg p-3"
    :style="{ width: mapDisplayMode === 'type' ? 'max-content' : '200px' }"
  >
    <LegendContent size="small" :filters="filters" :actions="actions" />
  </div>
</template>

<script setup lang="ts">
import type { FilterActions, FiltersState } from '~/types';

defineProps<{
  filters?: FiltersState;
  actions?: FilterActions;
}>();

const { mapDisplayMode } = useSettings();
</script>

<style scoped>
.legend-inline-container {
  pointer-events: auto;
}
</style>
