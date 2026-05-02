<template>
  <div>
    <div v-if="isMaintenance" class="text-amber-600 flex items-center justify-center gap-1" title="Données partielles">
      <Icon name="mdi:wrench" class="text-sm" />
      <span class="text-xs">maintenance</span>
    </div>
    <div v-else-if="evolution === null" class="text-gray-400 text-xs">Données indisponibles</div>
    <div v-else-if="isStable" class="text-gray-600 flex items-center justify-center">
      <Icon name="mdi:approximately-equal" />
      <span>stable</span>
    </div>
    <div v-else-if="evolution > 0" class="text-green-600 flex items-center justify-center">
      <Icon name="mdi:arrow-top-right-thin" />
      <span>+{{ evolution }}%</span>
    </div>
    <div v-else class="text-red-600 flex items-center justify-center">
      <Icon name="mdi:arrow-bottom-right-thin" />
      <span>{{ evolution }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  count1?: number;
  count2?: number;
}>();

const { isCountInMaintenance, computeEvolution, isStableEvolution } = useCounterUtils();

const isMaintenance = computed(() => isCountInMaintenance(props.count2, props.count1));
const evolution = computed(() => computeEvolution(props.count1, props.count2));
const isStable = computed(() => isStableEvolution(evolution.value));
</script>
