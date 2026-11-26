<template>
  <div class="space-y-6">
    <FilterSection
      title="Filtrer par statut d'avancement"
      :filters="filters.statusFilters.value"
      :show-selection-buttons="true"
      @toggle-filter="actions.toggleStatusFilter"
      @select-all="
        filters.statusFilters.value.forEach((status: StatusTypeQualityFilterItem) => (status.isEnabled = true))
      "
      @deselect-all="
        filters.statusFilters.value.forEach((status: StatusTypeQualityFilterItem) => (status.isEnabled = false))
      "
    />

    <FilterSection
      title="Filtrer par qualité d'aménagement"
      :filters="filters.qualityFilters.value"
      :show-selection-buttons="false"
      @toggle-filter="actions.toggleQualityFilter"
    />

    <FilterSection
      title="Filtrer par type d'aménagement"
      :filters="filters.typeFilters.value"
      :show-selection-buttons="true"
      @toggle-filter="actions.toggleTypeFilter"
      @select-all="filters.typeFilters.value.forEach((type: StatusTypeQualityFilterItem) => (type.isEnabled = true))"
      @deselect-all="filters.typeFilters.value.forEach((type: StatusTypeQualityFilterItem) => (type.isEnabled = false))"
    />

    <template v-if="options.showLineFilters">
      <FilterSection
        v-for="group in lineFilterGroups"
        :key="group.category"
        :title="group.title"
        :filters="group.items.map((item) => item.filter)"
        :show-selection-buttons="group.items.length > 2"
        @toggle-filter="(index: number) => actions.toggleLineFilter(group.items[index]!.index)"
        @select-all="group.items.forEach((item) => (item.filter.isEnabled = true))"
        @deselect-all="group.items.forEach((item) => (item.filter.isEnabled = false))"
      />
    </template>

    <section v-if="options.showCounters">
      <label class="mt-2 flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          :checked="filters.showCounters.value"
          class="h-4 w-4 rounded border-gray-300 text-lvv-blue-600 focus:ring-lvv-blue-600"
          @change="actions.toggleShowCounters"
        />
        <span class="text-base font-medium">Afficher les compteurs</span>
      </label>
    </section>

    <div v-if="options.showDateFilter && filters.minDate.value !== filters.maxDate.value" class="mt-2">
      <h3 class="text-base font-medium mb-4">Filtrer par date de réalisation</h3>
      <div>
        <DoubleRangeSlider
          :model-value="filters.dateRange.value"
          :min="filters.minDate.value"
          :max="filters.maxDate.value"
          :step="1"
          @update:model-value="actions.setDateRange"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-2">
          <span>{{ formatMonthYear(filters.dateRange.value[0]) }}</span>
          <span>{{ formatMonthYear(filters.dateRange.value[1]) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FilterSection from '~/components/filter/FilterSection.vue';
import DoubleRangeSlider from '~/components/DoubleRangeSlider.vue';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import type { FiltersState, FilterActions, StatusTypeQualityFilterItem } from '~/types';
import type { LineCategory } from '~/helpers/lines';
dayjs.locale('fr');

const { getRevName, getSecondaryRevName } = useConfig();

const props = defineProps<{
  showLineFilters: boolean;
  showDateFilter?: boolean;
  showCounters?: boolean;
  filters: FiltersState;
  actions: FilterActions;
}>();
const defaultOptions = { showLineFilters: false, showDateFilter: false, showCounters: false };
const options = { ...defaultOptions, ...props };

const lineFilterGroups = computed(() => {
  const groups: { category: LineCategory; title: string }[] = [
    { category: 'main', title: `Filtrer par ${getRevName('singular').toLowerCase()}` },
    { category: 'secondary', title: `Filtrer par ${getSecondaryRevName('singular').toLowerCase()}` },
    { category: 'other', title: 'Autres' },
  ];

  const items = props.filters.lineFilters.value.map((filter, index) => ({ filter, index }));
  return groups
    .map((group) => ({ ...group, items: items.filter((item) => item.filter.category === group.category) }))
    .filter((group) => group.items.length > 0);
});

function formatMonthYear(stepIndex: number) {
  if (stepIndex >= props.filters.dateSteps.value.length || stepIndex < 0) {
    return '2026+';
  }

  const monthIndex = props.filters.dateSteps.value[stepIndex];
  if (monthIndex === undefined || monthIndex >= 999999) {
    return '2026+';
  }

  const year = Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  return dayjs(new Date(year, month)).format('MMM YYYY');
}
</script>
