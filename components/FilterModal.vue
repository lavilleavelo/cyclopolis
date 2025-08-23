<template>
  <Dialog :open="isOpen" class="relative z-50" @close="closeModal">
    <!-- backdrop-->
    <div class="fixed inset-0 bg-black/30" aria-hidden="true" />

    <!-- dialog itself-->
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="relative p-4 w-full max-w-sm rounded bg-white">
        <button
          type="button"
          class="absolute top-1 right-1 bg-white rounded-md p-1 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          @click="closeModal"
        >
          <Icon name="mdi:close" class="h-6 w-6" aria-hidden="true" />
        </button>
        <DialogTitle class="text-lg font-medium leading-6 text-gray-900">
          Filtres
        </DialogTitle>

        <div class="mt-2 text-base font-medium">
          Filtrer par statut d'avancement
        </div>
        <div class="mt-2 flex flex-wrap gap-x-2 gap-y-3">
          <div
            v-for="(statusFilter, index) in statusFilters"
            :key="statusFilter.label"
            class="px-2 py-1 border rounded-2xl text-sm cursor-pointer focus:outline-none ring-lvv-blue-600 ring-2"
            :class="{
              'bg-lvv-blue-600 border-transparent text-white ring-offset-1 hover:bg-lvv-blue-500': statusFilter.isEnable,
              'bg-white border-gray-200 text-gray-900 hover:bg-gray-50': !statusFilter.isEnable
            }"
            @click="toggleStatusFilter(index)"
          >
            {{ statusFilter.label }}
          </div>
        </div>
        <div class="mt-2 text-base font-medium">
          Filtrer par type d'aménagement
        </div>
        <div class="mt-2 flex flex-wrap gap-x-2 gap-y-3">
          <div
            v-for="(typeFilter, index) in typeFilters"
            :key="typeFilter.label"
            class="px-2 py-1 border rounded-2xl text-sm cursor-pointer focus:outline-none ring-lvv-blue-600 ring-2"
            :class="{
              'bg-lvv-blue-600 border-transparent text-white ring-offset-1 hover:bg-lvv-blue-500': typeFilter.isEnable,
              'bg-white border-gray-200 text-gray-900 hover:bg-gray-50': !typeFilter.isEnable
            }"
            @click="toggleTypeFilter(index)"
          >
            {{ typeFilter.label }}
          </div>
        </div>
        <div class="mt-2 text-base font-medium">
          Filtrer par qualité d'aménagement
        </div>
        <div class="mt-2 flex flex-wrap gap-x-2 gap-y-3">
          <div
            v-for="(qualityFilter, index) in qualityFilters"
            :key="qualityFilter.label"
            class="px-2 py-1 border rounded-2xl text-sm cursor-pointer focus:outline-none ring-lvv-blue-600 ring-2"
            :class="{
              'bg-lvv-blue-600 border-transparent text-white ring-offset-1 hover:bg-lvv-blue-500': qualityFilter.isEnable,
              'bg-white border-gray-200 text-gray-900 hover:bg-gray-50': !qualityFilter.isEnable
            }"
            @click="toggleQualityFilter(index)"
          >
            {{ qualityFilter.label }}
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';

const isOpen = ref(false);

function closeModal() {
  isOpen.value = false;
}
function openModal() {
  isOpen.value = true;
}

defineExpose({
  openModal
});

const statusFilters = ref([
  { label: 'Terminé', isEnable: true, statuses: ['done'] },
  { label: 'En travaux', isEnable: true, statuses: ['wip', 'tested'] },
  { label: 'Prévu pour 2026', isEnable: true, statuses: ['planned', 'variante'] },
  { label: 'Reporté', isEnable: true, statuses: ['postponed', 'variante-postponed'] },
  { label: 'Inconnu', isEnable: true, statuses: ['unknown'] }
]);

const typeFilters = ref([
  { label: 'Bidirectionnelle', isEnable: true, types: ['bidirectionnelle'] },
  { label: 'Bilaterale', isEnable: true, types: ['bilaterale'] },
  { label: 'Voie Bus', isEnable: true, types: ['voie-bus', 'voie-bus-elargie'] },
  { label: 'Voie verte', isEnable: true, types: ['voie-verte'] },
  { label: 'Vélorue', isEnable: true, types: ['velorue'] },
  { label: 'Bandes cyclables', isEnable: true, types: ['bandes-cyclables'] },
  { label: 'Zone de rencontre', isEnable: true, types: ['zone-de-rencontre'] },
  { label: 'Inconnu', isEnable: true, types: ['inconnu'] },
  { label: 'Aucun', isEnable: true, types: ['aucun'] }
]);

const qualityFilters = ref([
  { label: 'Satisfaisant', isEnable: true, qualities: ['satisfactory'] },
  { label: 'Non satisfaisant', isEnable: true, qualities: ['unsatisfactory'] }
]);

function toggleStatusFilter(index: number) {
  statusFilters.value[index].isEnable = !statusFilters.value[index].isEnable;
}

function toggleTypeFilter(index: number) {
  typeFilters.value[index].isEnable = !typeFilters.value[index].isEnable;
}

function toggleQualityFilter(index: number) {
  qualityFilters.value[index].isEnable = !qualityFilters.value[index].isEnable;
}

const emit = defineEmits(['update']);

watch([statusFilters, typeFilters, qualityFilters], () => {
  const visibleStatuses = statusFilters.value
    .filter(item => item.isEnable)
    .flatMap(item => item.statuses);

  const visibleTypes = typeFilters.value
    .filter(item => item.isEnable)
    .flatMap(item => item.types);

  const visibleQualities = qualityFilters.value
    .filter(item => item.isEnable)
    .flatMap(item => item.qualities);

  emit('update', { visibleStatuses, visibleTypes, visibleQualities });
}, { deep: true });

</script>
