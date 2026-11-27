<template>
  <ClientOnly>
    <BottomSheet
      :open="isOpen"
      title="Légende"
      panel-id="legend-sheet-panel"
      fit-content
      elevated
      close-on-escape
      @close="closeSheet"
    >
      <LegendContent size="large" :filters="filters" :actions="actions" />
    </BottomSheet>
  </ClientOnly>
</template>

<script setup lang="ts">
import BottomSheet from '~/components/BottomSheet.vue';
import type { FilterActions, FiltersState } from '~/types';

defineProps<{
  filters?: FiltersState;
  actions?: FilterActions;
}>();

const route = useRoute();
const isOpen = ref(false);

function closeSheet() {
  isOpen.value = false;
}

function toggleSheet() {
  isOpen.value = !isOpen.value;
}

watch(
  () => route.query.modal,
  (modal) => {
    if (modal) {
      closeSheet();
    }
  },
);

defineExpose({
  toggleSheet,
});
</script>
