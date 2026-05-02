<template>
  <NuxtLink
    class="rounded-lg shadow-md hover:shadow-lg overflow-hidden bg-white"
    :to="link"
    @mouseenter="$emit('highlight', name)"
    @mouseleave="$emit('highlight', null)"
  >
    <div class="px-4 py-2 bg-lvv-blue-600 text-white">
      <div class="flex items-center justify-between">
        <div class="text-xs font-normal text-white/80">
          {{ arrondissement }}
        </div>
        <div v-if="counter.lines && counter.lines.length > 0" class="flex gap-1">
          <span
            v-for="line in counter.lines"
            :key="line"
            class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white border border-white/50"
            :style="{ backgroundColor: getLineColor(line) }"
          >
            {{ line }}
          </span>
        </div>
      </div>
      <div class="text-base font-semibold">
        {{ name }}
      </div>
    </div>
    <div
      v-if="isSelectedDataAnomalous"
      class="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center gap-2"
    >
      <Icon name="mdi:wrench" class="text-amber-600 text-sm flex-shrink-0" />
      <span class="text-xs text-amber-700">Compteur en maintenance · données partielles</span>
    </div>
    <table class="w-full bg-white">
      <thead>
        <tr class="bg-lvv-blue-100">
          <th class="w-1/6 italic font-normal">
            {{ headerPeriodLabel }}
          </th>
          <th class="w-1/4">
            {{ referenceYearLabel }}
          </th>
          <th class="w-1/4">
            {{ selectedYearLabel }}
          </th>
          <th class="w-1/4 italic font-normal border-l-2 border-lvv-blue-600">évolution</th>
        </tr>
      </thead>
      <tbody>
        <!-- ligne vélo -->
        <tr v-if="isTrackingVelo">
          <td class="flex items-center justify-center p-1 h-full">
            <Icon name="fluent:vehicle-bicycle-16-regular" class="text-3xl" />
          </td>
          <td class="text-center p-1">
            {{ formatRecordCount(referenceVelo, referenceDays) }}
          </td>
          <td class="text-center p-1">
            <span class="relative">
              {{ formatRecordCount(currentVelo, currentDays) }}
              <Icon
                v-if="isVeloRecord"
                name="noto:1st-place-medal"
                class="text-xs absolute -top-1.5 -right-3.5"
                :title="'Record pour ce mois !'"
              />
            </span>
          </td>
          <td class="text-center p-1 border-l-2 border-lvv-blue-600">
            <CounterEvolution :count1="referenceVelo" :count2="currentVelo" />
          </td>
        </tr>

        <!-- ligne voiture -->
        <tr v-if="isTrackingVoiture">
          <td class="flex items-center justify-center p-1 h-full">
            <Icon name="fluent:vehicle-car-profile-ltr-16-regular" class="text-3xl" />
          </td>
          <td class="text-center p-1">
            {{ formatRecordCount(referenceVoiture, referenceDays) }}
          </td>
          <td class="text-center p-1">
            <span class="relative">
              {{ formatRecordCount(currentVoiture, currentDays) }}
              <Icon
                v-if="isVoitureRecord"
                name="noto:1st-place-medal"
                class="text-xs absolute -top-1.5 -right-3.5"
                :title="'Record pour ce mois !'"
              />
            </span>
          </td>
          <td class="text-center p-1 border-l-2 border-lvv-blue-600">
            <CounterEvolution :count1="referenceVoiture" :count2="currentVoiture" />
          </td>
        </tr>
      </tbody>
    </table>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import type { ComparisonPeriod, DisplayMode } from '~/components/counter/ListLayout.vue';

type Counter = Omit<Collections['compteurs'], 'counts'> & {
  counts: {
    month: string;
    veloCount?: number;
    voitureCount?: number;
  }[];
};

const props = defineProps<{
  counter: Counter;
  comparisonPeriod: ComparisonPeriod;
  selectedMonth: string;
  selectedYear: number;
  referenceYearOffset: number;
  displayMode: DisplayMode;
}>();

defineEmits<{
  highlight: [name: string | null];
}>();

const { getLineColor } = useColors();
const { isCountInMaintenance, findSameMonthYearsAgo, findCountForMonth, aggregateMatchedYears } = useCounterUtils();

const arrondissement = props.counter.arrondissement;
const name = props.counter.name;
const link = props.counter.path;

const isTrackingVelo = props.counter.counts.every((count) => count.veloCount !== undefined);
const isTrackingVoiture = props.counter.counts.every((count) => count.voitureCount !== undefined);

function daysInMonth(monthIso: string): number {
  const d = new Date(monthIso);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

const monthlyRecord = computed(() =>
  props.comparisonPeriod === 'monthly' ? findCountForMonth(props.counter.counts, props.selectedMonth) : undefined,
);

const monthlyReference = computed(() => {
  if (props.comparisonPeriod !== 'monthly' || !monthlyRecord.value) {
    return undefined;
  }

  return findSameMonthYearsAgo(props.counter.counts, monthlyRecord.value, props.referenceYearOffset);
});

const annualVelo = computed(() => {
  if (props.comparisonPeriod !== 'annual') {
    return null;
  }

  return aggregateMatchedYears(
    props.counter.counts,
    props.selectedYear,
    props.selectedYear - props.referenceYearOffset,
    (c) => c.veloCount ?? 0,
  );
});

const annualVoiture = computed(() => {
  if (props.comparisonPeriod !== 'annual') {
    return null;
  }

  return aggregateMatchedYears(
    props.counter.counts,
    props.selectedYear,
    props.selectedYear - props.referenceYearOffset,
    (c) => c.voitureCount ?? 0,
  );
});

const currentVelo = computed(() => {
  if (props.comparisonPeriod === 'annual') {
    return annualVelo.value && annualVelo.value.matchedMonths > 0 ? annualVelo.value.currentTotal : undefined;
  }

  return monthlyRecord.value?.veloCount;
});

const referenceVelo = computed(() => {
  if (props.comparisonPeriod === 'annual') {
    return annualVelo.value && annualVelo.value.matchedMonths > 0 ? annualVelo.value.referenceTotal : undefined;
  }

  return monthlyReference.value?.veloCount;
});

const currentVoiture = computed(() => {
  if (props.comparisonPeriod === 'annual') {
    return annualVoiture.value && annualVoiture.value.matchedMonths > 0 ? annualVoiture.value.currentTotal : undefined;
  }

  return monthlyRecord.value?.voitureCount;
});

const referenceVoiture = computed(() => {
  if (props.comparisonPeriod === 'annual') {
    return annualVoiture.value && annualVoiture.value.matchedMonths > 0
      ? annualVoiture.value.referenceTotal
      : undefined;
  }

  return monthlyReference.value?.voitureCount;
});

const currentDays = computed(() => {
  if (props.comparisonPeriod === 'annual') {
    return annualVelo.value?.currentDays ?? annualVoiture.value?.currentDays ?? 0;
  }

  return monthlyRecord.value ? daysInMonth(monthlyRecord.value.month) : 0;
});

const referenceDays = computed(() => {
  if (props.comparisonPeriod === 'annual') {
    return annualVelo.value?.referenceDays ?? annualVoiture.value?.referenceDays ?? 0;
  }

  return monthlyReference.value ? daysInMonth(monthlyReference.value.month) : 0;
});

const headerPeriodLabel = computed(() => {
  if (props.comparisonPeriod === 'annual') {
    return 'année';
  }

  return new Date(props.selectedMonth).toLocaleString('fr-FR', { month: 'short' });
});

const selectedYearLabel = computed(() => {
  return props.comparisonPeriod === 'annual' ? props.selectedYear : new Date(props.selectedMonth).getFullYear();
});

const referenceYearLabel = computed(() => selectedYearLabel.value - props.referenceYearOffset);

const isSelectedDataAnomalous = computed(() => {
  if (currentVelo.value === undefined && currentVoiture.value === undefined) {
    return false;
  }

  if (isTrackingVelo && isCountInMaintenance(currentVelo.value ?? 0, referenceVelo.value ?? 0)) {
    return true;
  }

  return isTrackingVoiture && isCountInMaintenance(currentVoiture.value ?? 0, referenceVoiture.value ?? 0);
});

function formatRecordCount(count?: number, days?: number): string {
  if (count === undefined) {
    return '—';
  }

  if (props.displayMode === 'daily') {
    if (!days || days === 0) {
      return '—';
    }

    return `${Math.round(count / days).toLocaleString('fr-FR')}\u00a0/j`;
  }

  return count.toLocaleString('fr-FR');
}

function isMonthlyRecordForMonth(field: 'veloCount' | 'voitureCount'): boolean {
  const record = monthlyRecord.value;
  if (!record) {
    return false;
  }

  const currentValue = record[field];
  if (currentValue === undefined || currentValue === 0) {
    return false;
  }

  const recordMonth = new Date(record.month).getMonth();
  const sameMonthCounts = props.counter.counts
    .filter((count) => new Date(count.month).getMonth() === recordMonth)
    .map((count) => count[field] ?? 0);

  return currentValue >= Math.max(...sameMonthCounts);
}

const isVeloRecord = computed(
  () => props.comparisonPeriod === 'monthly' && isTrackingVelo && isMonthlyRecordForMonth('veloCount'),
);

const isVoitureRecord = computed(
  () => props.comparisonPeriod === 'monthly' && isTrackingVoiture && isMonthlyRecordForMonth('voitureCount'),
);
</script>
