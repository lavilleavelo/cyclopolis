<template>
  <NuxtLink class="rounded-lg shadow-md hover:shadow-lg overflow-hidden" :to="link">
    <div class="px-4 py-2 bg-lvv-blue-600 text-white">
      <div class="flex items-center justify-between">
        <div class="text-base font-medium">
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
      <div class="mt-1 text-lg font-semibold">
        {{ name }}
      </div>
    </div>
    <div v-if="isLatestDataAnomalous" class="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center gap-2">
      <Icon name="mdi:wrench" class="text-amber-600 text-sm flex-shrink-0" />
      <span class="text-xs text-amber-700">Compteur en maintenance — données partielles</span>
    </div>
    <table class="w-full bg-white">
      <thead>
        <tr class="bg-lvv-blue-100">
          <th class="w-1/6 italic font-normal">
            {{ formatRecordMonth(lastRecord) }}
          </th>
          <th class="w-1/4">
            {{ formatRecordYear(lastRecord) - 1 }}
          </th>
          <th class="w-1/4">
            {{ formatRecordYear(lastRecord) }}
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
            {{ formatRecordCount(lastRecordPreviousYear?.veloCount) }}
          </td>
          <td class="text-center p-1">
            <span class="relative">
              {{ formatRecordCount(lastRecord?.veloCount) }}
              <Icon
                v-if="isVeloRecord"
                name="noto:1st-place-medal"
                class="text-xs absolute -top-1.5 -right-3.5"
                :title="'Record pour ce mois !'"
              />
            </span>
          </td>
          <td class="text-center p-1 border-l-2 border-lvv-blue-600">
            <CounterEvolution :count1="lastRecordPreviousYear?.veloCount" :count2="lastRecord?.veloCount" />
          </td>
        </tr>

        <!-- ligne voiture -->
        <tr v-if="isTrackingVoiture">
          <td class="flex items-center justify-center p-1 h-full">
            <Icon name="fluent:vehicle-car-profile-ltr-16-regular" class="text-3xl" />
          </td>
          <td class="text-center p-1">
            {{ formatRecordCount(lastRecordPreviousYear?.voitureCount) }}
          </td>
          <td class="text-center p-1">
            <span class="relative">
              {{ formatRecordCount(lastRecord?.voitureCount) }}
              <Icon
                v-if="isVoitureRecord"
                name="noto:1st-place-medal"
                class="text-xs absolute -top-1.5 -right-3.5"
                :title="'Record pour ce mois !'"
              />
            </span>
          </td>
          <td class="text-center p-1 border-l-2 border-lvv-blue-600">
            <CounterEvolution :count1="lastRecordPreviousYear?.voitureCount" :count2="lastRecord?.voitureCount" />
          </td>
        </tr>
      </tbody>
    </table>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';

type Counter = Omit<Collections['compteurs'], 'counts'> & {
  counts: {
    month: string;
    veloCount?: number;
    voitureCount?: number;
  }[];
};

const props = defineProps<{
  counter: Counter;
}>();

const { getLineColor } = useColors();

const arrondissement = props.counter.arrondissement;
const name = props.counter.name;
const link = props.counter.path;

const isTrackingVelo = props.counter.counts.every((count) => count.veloCount !== undefined);
const isTrackingVoiture = props.counter.counts.every((count) => count.voitureCount !== undefined);

const lastRecord = props.counter.counts[props.counter.counts.length - 1];
const lastRecordPreviousYear = getSameRecordPreviousYear(lastRecord);

const { isCountInMaintenance } = useCounterMaintenance();

const isLatestDataAnomalous = computed(() => {
  if (!lastRecord || !lastRecordPreviousYear) {
    return false;
  }

  if (isTrackingVelo && isCountInMaintenance(lastRecord.veloCount ?? 0, lastRecordPreviousYear.veloCount ?? 0)) {
    return true;
  }

  return (
    isTrackingVoiture && isCountInMaintenance(lastRecord.voitureCount ?? 0, lastRecordPreviousYear.voitureCount ?? 0)
  );
});

/**
 * formatters
 */
function formatRecordMonth(record: Counter['counts'][0]): string {
  return new Date(record.month).toLocaleString('fr-Fr', { month: 'short' });
}

function formatRecordYear(record: Counter['counts'][0]): number {
  return new Date(record.month).getFullYear();
}

function formatRecordCount(count?: number) {
  if (count === undefined) {
    return 'N/A';
  }
  return count.toLocaleString('fr-FR') ?? 0;
}

/**
 * helpers
 */
function getSameRecordPreviousYear(record: Counter['counts'][0]): Counter['counts'][0] | undefined {
  const recordMonth = new Date(record.month).getMonth();
  const recordYear = new Date(record.month).getFullYear();
  return props.counter.counts.find((count) => {
    return new Date(count.month).getMonth() === recordMonth && new Date(count.month).getFullYear() === recordYear - 1;
  });
}

function isRecordForMonth(field: 'veloCount' | 'voitureCount'): boolean {
  if (!lastRecord) return false;
  const currentValue = lastRecord[field];
  if (currentValue === undefined || currentValue === 0) return false;
  const recordMonth = new Date(lastRecord.month).getMonth();
  const sameMonthCounts = props.counter.counts
    .filter((count) => new Date(count.month).getMonth() === recordMonth)
    .map((count) => count[field] ?? 0);
  return currentValue >= Math.max(...sameMonthCounts);
}

const isVeloRecord = isTrackingVelo && isRecordForMonth('veloCount');
const isVoitureRecord = isTrackingVoiture && isRecordForMonth('voitureCount');
</script>
