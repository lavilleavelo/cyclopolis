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

    <FilterSection
      v-if="options.showLineFilters"
      title="Filtrer par voie lyonnaise"
      :filters="filters.lineFilters.value"
      :show-selection-buttons="true"
      @toggle-filter="actions.toggleLineFilter"
      @select-all="filters.lineFilters.value.forEach((line: LineFilterItem) => (line.isEnabled = true))"
      @deselect-all="filters.lineFilters.value.forEach((line: LineFilterItem) => (line.isEnabled = false))"
    />

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
import type { FiltersState, FilterActions, StatusTypeQualityFilterItem, LineFilterItem } from '~/types';
dayjs.locale('fr');

const props = defineProps<{
  showLineFilters: boolean;
  showDateFilter?: boolean;
  filters: FiltersState;
  actions: FilterActions;
}>();
const defaultOptions = { showLineFilters: false, showDateFilter: false };
const options = { ...defaultOptions, ...props };

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
