<template>
  <div>
    <!-- Dialog view small screens -->
    <Dialog v-if="!isLargeScreen || !props.canUseSidePanel" :open="isOpen" class="relative z-50" @close="closeModal">
      <!-- backdrop-->
      <div class="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="relative p-4 w-full max-w-sm rounded bg-white overflow-y-auto max-h-[80vh]">
          <button
            type="button"
            class="absolute top-1 right-1 bg-white rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            @click="closeModal"
          >
            <Icon name="mdi:close" class="h-6 w-6" aria-hidden="true" />
          </button>
          <DialogTitle class="text-lg font-medium leading-6 text-gray-900 mb-4"> Filtres </DialogTitle>
          <FilterForm :show-line-filters="showLineFilters" @update="handleUpdate" />
        </DialogPanel>
      </div>
    </Dialog>

    <!-- Sidebar on large screens -->
    <div v-if="isOpen && props.canUseSidePanel && isLargeScreen" class="hidden lg:flex flex-col h-full w-96 p-4 overflow-y-auto bg-white border-l">
      <h2 class="text-lg font-medium leading-6 text-gray-900 mb-4"> Filtres </h2>
      <FilterForm :show-line-filters="showLineFilters" @update="handleUpdate" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import { useRoute, useRouter } from 'vue-router';
import FilterForm from '~/components/filter/FilterForm.vue';
import { useMediaQuery } from '@vueuse/core';

const props = defineProps<{
  showLineFilters: boolean
  canUseSidePanel?: boolean
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

function handleUpdate(payload: { lines: number[]; years: number[] }) {
  emit('update', payload);
}

</script>
