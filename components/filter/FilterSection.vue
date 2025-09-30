<template>
  <section>
    <div class="mt-2 text-base font-medium">{{ title }}</div>
    <div class="mt-2 flex flex-wrap gap-x-2 gap-y-3">
      <FilterButton
        v-for="(filter, index) in filters"
        :key="filter.label"
        :label="filter.label"
        :is-enabled="filter.isEnable"
        @click="emit('toggleFilter', index)"
      />
    </div>
    <div v-if="showSelectionButtons" class="mt-4 flex justify-start space-x-4">
      <button
        type="button"
        class="inline-flex justify-center bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lvv-blue-600 focus:ring-offset-2"
        :class="{ 'opacity-50 cursor-not-allowed': filters.every(filter => !filter.isEnable) }"
        :disabled="filters.every(filter => !filter.isEnable)"
        @click="emit('deselectAll')"
      >
        Désélectionner tout
      </button>
      <button
        type="button"
        class="inline-flex justify-center bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lvv-blue-600 focus:ring-offset-2"
        :disabled="filters.every(filter => filter.isEnable)"
        :class="{ 'opacity-50 cursor-not-allowed': filters.every(filter => filter.isEnable) }"
        @click="emit('selectAll')"
      >
        Tout sélectionner
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import FilterButton from '~/components/filter/FilterButton.vue';

defineProps<{
  title: string;
  filters: { label: string; isEnable: boolean }[];
  showSelectionButtons: boolean;
}>();

const emit = defineEmits(['toggleFilter', 'selectAll', 'deselectAll']);
</script>
