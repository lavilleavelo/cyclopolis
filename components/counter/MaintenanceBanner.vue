<template>
  <p
    v-if="isAnomalous"
    class="not-prose text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-4 text-center"
  >
    <Icon name="mdi:wrench" class="text-amber-600 align-text-bottom" />
    Compteur en maintenance · données partielles ou incomplètes
  </p>
</template>

<script setup lang="ts">
const props = defineProps<{
  counts: { month: string; count: number }[];
}>();

const { isCountsInMaintenance } = useCounterUtils();

const isAnomalous = computed(() => isCountsInMaintenance(props.counts));
</script>
