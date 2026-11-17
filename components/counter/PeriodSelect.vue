<template>
  <div class="flex flex-wrap items-center gap-2 mt-6">
    <label :for="id" class="text-xs text-gray-500 whitespace-nowrap lg:text-sm">Période</label>
    <select
      :id="id"
      v-model="selected"
      class="text-xs border border-gray-300 rounded-md shadow-sm focus:ring-lvv-blue-600 focus:border-lvv-blue-600 py-1 pl-2 pr-6"
    >
      <option v-for="option in STATS_PERIOD_OPTIONS" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
      <option v-for="year in years" :key="year" :value="year">
        {{ year }}{{ year === currentYear ? ' (en cours)' : '' }}
      </option>
      <option :value="CUSTOM" :disabled="!firstDay || !lastDay">Période personnalisée</option>
    </select>
    <div v-if="isStatsRange(period)" class="flex items-center gap-2 text-xs text-gray-500 lg:text-sm">
      <span>du</span>
      <input
        type="date"
        :value="period.from"
        :min="firstDay"
        :max="period.to"
        aria-label="Début de la période"
        :class="inputClass"
        @change="setRange({ from: ($event.target as HTMLInputElement).value })"
      />
      <span>au</span>
      <input
        type="date"
        :value="period.to"
        :min="period.from"
        :max="lastDay"
        aria-label="Fin de la période"
        :class="inputClass"
        @change="setRange({ to: ($event.target as HTMLInputElement).value })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  STATS_PERIOD_OPTIONS,
  customRangeFrom,
  isStatsRange,
  type StatsPeriod,
  type StatsRange,
} from '~/composables/useCounterDetailedStats';

const CUSTOM = 'custom';

const props = defineProps<{
  years: number[];
  currentYear: number | null;
  firstDay?: string | null;
  lastDay?: string | null;
}>();

const period = defineModel<StatsPeriod>({ required: true });
const id = useId();

const inputClass =
  'text-xs text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-lvv-blue-600 focus:border-lvv-blue-600 invalid:border-red-500 py-1 px-2';

const selected = computed<Exclude<StatsPeriod, StatsRange> | typeof CUSTOM>({
  get: () => (isStatsRange(period.value) ? CUSTOM : period.value),
  set: (value) => {
    if (value !== CUSTOM) {
      period.value = value;
    } else if (props.firstDay && props.lastDay) {
      period.value = customRangeFrom(period.value, props.firstDay, props.lastDay);
    }
  },
});

// Dates being typed (year 0002…), out of the counter's lifetime or in the wrong order are ignored
function setRange(change: Partial<StatsRange>) {
  if (!isStatsRange(period.value)) {
    return;
  }

  const range = { ...period.value, ...change };
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(change.from ?? change.to ?? '') &&
    range.from <= range.to &&
    (!props.firstDay || range.from >= props.firstDay) &&
    (!props.lastDay || range.to <= props.lastDay);
  if (valid) {
    period.value = range;
  }
}
</script>
