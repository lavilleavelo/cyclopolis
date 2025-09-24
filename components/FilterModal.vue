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
        <DialogTitle class="text-lg font-medium leading-6 text-gray-900"> Filtres </DialogTitle>

        <div class="space-y-6">
          <FilterSection
            title="Filtrer par statut d'avancement"
            :filters="statusFilters"
            :show-selection-buttons="true"
            @toggle-filter="toggleStatusFilter"
            @select-all="statusFilters.forEach(status => (status.isEnable = true))"
            @deselect-all="statusFilters.forEach(status => (status.isEnable = false))"
          />

          <FilterSection
            title="Filtrer par type d'aménagement"
            :filters="typeFilters"
            :show-selection-buttons="true"
            @toggle-filter="toggleTypeFilter"
            @select-all="typeFilters.forEach(type => (type.isEnable = true))"
            @deselect-all="typeFilters.forEach(type => (type.isEnable = false))"
          />

          <FilterSection
            title="Filtrer par qualité d'aménagement"
            :filters="qualityFilters"
            :show-selection-buttons="false"
            @toggle-filter="toggleQualityFilter"
          />

          <FilterSection
            v-if="options.showLineFilters"
            title="Filtrer par voie lyonnaise"
            :filters="lineFilters"
            :show-selection-buttons="true"
            @toggle-filter="toggleLineFilter"
            @select-all="lineFilters.forEach(line => (line.isEnable = true))"
            @deselect-all="lineFilters.forEach(line => (line.isEnable = false))"
          />
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import { useRoute, useRouter } from 'vue-router';
import FilterSection from '~/components/filter/FilterSection.vue';

const props = defineProps<{ showLineFilters: boolean }>();
const defaultOptions = { showLineFilters: false };
const options = { ...defaultOptions, ...props };

const route = useRoute();
const router = useRouter();

const isOpen = ref(false);

function closeModal() {
  const query = { ...route.query };
  delete query.modal;
  router.replace({ query });
}

function openModal() {
  router.replace({ query: { ...route.query, modal: 'filters' } });
}

watch(() => route.query.modal, (newVal) => {
  isOpen.value = newVal === 'filters';
}, { immediate: true });

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

const lineFilters = ref<{ label: string; isEnable: boolean; line: number }[]>([]);


const query = route.query;

if (Object.prototype.hasOwnProperty.call(query, 'statuses')) {
  const enabled = (query.statuses && (query.statuses as string).length > 0) ? (query.statuses as string).split(',') : [];
  statusFilters.value.forEach(f => f.isEnable = f.statuses.every(s => enabled.includes(s)));
}
if (Object.prototype.hasOwnProperty.call(query, 'types')) {
  const enabled = (query.types && (query.types as string).length > 0) ? (query.types as string).split(',') : [];
  typeFilters.value.forEach(f => f.isEnable = f.types.every(t => enabled.includes(t)));
}
if (Object.prototype.hasOwnProperty.call(query, 'qualities')) {
  const enabled = (query.qualities && (query.qualities as string).length > 0) ? (query.qualities as string).split(',') : [];
  qualityFilters.value.forEach(f => f.isEnable = f.qualities.every(q => enabled.includes(q)));
}

const { data: lines } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesPage').order('line', 'ASC').all();
});

watch(
  lines,
  (newLines) => {
    const lines = new Set<number>();
    if (!newLines) {
      return;
    }

    newLines.forEach((voie) => {
      if (voie.line) lines.add(voie.line);
    });

    lineFilters.value = Array.from(lines)
      .sort((a, b) => a - b)
      .map(line => ({ label: `VL ${line}`, isEnable: true, line }));

    if (Object.prototype.hasOwnProperty.call(route.query, 'lines')) {
      const enabled = (route.query.lines && (route.query.lines as string).length > 0)
        ? (route.query.lines as string).split(',').map(l => +l)
        : [];
      lineFilters.value.forEach(f => f.isEnable = enabled.includes(f.line));
    }
  },
  { immediate: true }
);

function toggleStatusFilter(index: number) {
  statusFilters.value[index].isEnable = !statusFilters.value[index].isEnable;
}

function toggleTypeFilter(index: number) {
  typeFilters.value[index].isEnable = !typeFilters.value[index].isEnable;
}

function toggleQualityFilter(index: number) {
  qualityFilters.value[index].isEnable = !qualityFilters.value[index].isEnable;
}

function toggleLineFilter(index: number) {
  lineFilters.value[index].isEnable = !lineFilters.value[index].isEnable;
}

const emit = defineEmits(['update']);

watch(
  [statusFilters, typeFilters, qualityFilters, lineFilters],
  () => {
    const visibleStatuses = statusFilters.value.filter(item => item.isEnable).flatMap(item => item.statuses);
    const visibleTypes = typeFilters.value.filter(item => item.isEnable).flatMap(item => item.types);
    const visibleQualities = qualityFilters.value.filter(item => item.isEnable).flatMap(item => item.qualities);
    const visibleLines = lineFilters.value.filter(item => item.isEnable).map(item => item.line);

    emit('update', { visibleStatuses, visibleTypes, visibleQualities, visibleLines });

    const newQuery = { ...route.query };

    const allStatuses = statusFilters.value.flatMap(f => f.statuses);
    if (visibleStatuses.length < allStatuses.length) {
      newQuery.statuses = visibleStatuses.join(',');
    } else {
      delete newQuery.statuses;
    }

    const allTypes = typeFilters.value.flatMap(f => f.types);
    if (visibleTypes.length < allTypes.length) {
      newQuery.types = visibleTypes.join(',');
    } else {
      delete newQuery.types;
    }

    const allQualities = qualityFilters.value.flatMap(f => f.qualities);
    if (visibleQualities.length < allQualities.length) {
      newQuery.qualities = visibleQualities.join(',');
    } else {
      delete newQuery.qualities;
    }

    if (lineFilters.value.length > 0) {
      const allLines = lineFilters.value.map(f => f.line);
      if (visibleLines.length < allLines.length) {
        newQuery.lines = visibleLines.join(',');
      } else {
        delete newQuery.lines;
      }
    }

    router.replace({ query: newQuery });
  },
  { deep: true, immediate: true }
);
</script>