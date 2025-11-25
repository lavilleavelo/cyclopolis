<template>
  <!-- Bottom Sheet for small screens -->
  <ClientOnly>
    <BottomSheet
      v-if="(!isLargeScreen || !props.canUseSidePanel) && filters && actions"
      :open="isOpen"
      title="Filtres"
      @close="closeModal"
    >
      <FilterForm
        :show-line-filters="showLineFilters"
        :show-date-filter="showDateFilter"
        :filters="filters"
        :actions="actions"
      />
    </BottomSheet>
  </ClientOnly>

  <!-- Sidebar on large screens -->
  <div
    v-if="isOpen && props.canUseSidePanel && isLargeScreen && filters && actions"
    :style="props.filterStyle"
    class="hidden lg:flex flex-col min-w-[415px] w-[415px] p-4 overflow-y-auto bg-white border-l overflow-auto"
  >
    <h2 class="text-lg font-medium leading-6 text-gray-900 mb-4">Filtres</h2>
    <FilterForm
      :show-line-filters="showLineFilters"
      :show-date-filter="showDateFilter"
      :filters="filters"
      :actions="actions"
    />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import FilterForm from '~/components/filter/FilterForm.vue';
import BottomSheet from '~/components/BottomSheet.vue';
import { useMediaQuery } from '@vueuse/core';
import type { FiltersState, FilterActions } from '~/types';

const props = defineProps<{
  showLineFilters: boolean;
  showDateFilter?: boolean;
  canUseSidePanel?: boolean;
  filterStyle: string;
  filters?: FiltersState;
  actions?: FilterActions;
}>();

const route = useRoute();
const router = useRouter();

const isLargeScreen = useMediaQuery('(min-width: 1024px)');

const isOpen = ref(false);

function closeModal() {
  const query = { ...route.query };
  delete query.modal;
  router.replace({ query });
}

watch(
  () => route.query.modal,
  (newVal) => {
    isOpen.value = newVal === 'filters';
  },
  { immediate: true },
);
</script>
