<template>
  <div>
    <!-- Bottom Sheet for small screens -->
    <ClientOnly>
    <BottomSheet
      v-if="!isLargeScreen || !props.canUseSidePanel"
      :open="isOpen"
      title="Filtres"
      @close="closeModal"
    >
      <FilterForm :show-line-filters="showLineFilters" :show-date-filter="showDateFilter" :geojsons="geojsons" @update="handleUpdate" />
    </BottomSheet>
    </ClientOnly>

    <!-- Sidebar on large screens -->
    <div v-show="isOpen && props.canUseSidePanel && isLargeScreen" class="hidden lg:flex flex-col w-96 p-4 overflow-y-auto bg-white border-l h-[calc(100vh-100px)] pb-20 overflow-auto">
      <h2 class="text-lg font-medium leading-6 text-gray-900 mb-4"> Filtres </h2>
      <FilterForm :show-line-filters="showLineFilters" :show-date-filter="showDateFilter" :geojsons="geojsons" @update="handleUpdate" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import { useRoute, useRouter } from 'vue-router';
import FilterForm from '~/components/filter/FilterForm.vue';
import BottomSheet from '~/components/BottomSheet.vue';
import { useMediaQuery } from '@vueuse/core';

const props = defineProps<{
  showLineFilters: boolean
  showDateFilter?: boolean
  canUseSidePanel?: boolean
  geojsons?: Collections['voiesCyclablesGeojson'][]
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

watch(() => route.query.modal, (newVal) => {
  isOpen.value = newVal === 'filters';
}, { immediate: true });


const emit = defineEmits(['update']);

function handleUpdate(payload: { lines: number[]; years: number[]; visibleDateRange?: [number, number] }) {
  emit('update', payload);
}

</script>
