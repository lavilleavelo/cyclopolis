<template>
  <div
    class="legend-inline-container bg-white rounded-lg shadow-lg p-3"
    :style="{ width: mapDisplayMode === 'type' ? 'max-content' : '200px' }"
  >
    <LegendContent size="small" />
  </div>
</template>

<script setup lang="ts">
const { mapDisplayMode } = useSettings();
</script>

<style scoped>
.legend-inline-container {
  pointer-events: auto;
}
</style>
