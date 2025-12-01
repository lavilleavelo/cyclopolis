<template>
  <!-- Bottom Sheet for small screens -->
  <ClientOnly>
    <BottomSheet
      v-if="(!isLargeScreen || !props.canUseSidePanel) && filters && actions"
      :open="open"
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
  <Sidebar
    v-if="props.canUseSidePanel && isLargeScreen && filters && actions"
    :open="open"
    title="Filtres"
    simple-header
    :show-close-button="false"
    :sidebar-style="props.filterStyle"
    @close="closeModal"
  >
    <FilterForm
      :show-line-filters="showLineFilters"
      :show-date-filter="showDateFilter"
      :filters="filters"
      :actions="actions"
    />
  </Sidebar>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import FilterForm from '~/components/filter/FilterForm.vue';
import BottomSheet from '~/components/BottomSheet.vue';
import { useMediaQuery } from '@vueuse/core';
import type { FiltersState, FilterActions } from '~/types';
import Sidebar from '~/components/Sidebar.vue';

const props = defineProps<{
  open: boolean;
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

function closeModal() {
  const query = { ...route.query };
  delete query.modal;
  router.replace({ query });
}
</script>
