<template>
  <NuxtLink class="rounded-lg shadow-md hover:shadow-lg overflow-hidden" :to="link">
    <div class="px-4 py-2 bg-lvv-blue-600 text-white">
      <div class="text-base font-medium">
        {{ arrondissement }}
      </div>
      <div class="mt-1 text-lg font-semibold">
        {{ name }}
      </div>
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
            {{ formatRecordCount(lastRecord?.veloCount) }}
          </td>
          <!-- <td class="text-center p-1">
            <div class="flex items-center justify-center">
              <span>{{ lastRecord.value }}</span>
              <Icon v-if="isLastRecordMax(counter)" name="iconoir:medal-1st-solid" class="text-lvv-pink text-xl" />
            </div>
          </td> -->
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
            {{ formatRecordCount(lastRecord?.voitureCount) }}
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

const arrondissement = props.counter.arrondissement;
const name = props.counter.name;
const link = props.counter.path;

const isTrackingVelo = props.counter.counts.every((count) => count.veloCount !== undefined);
const isTrackingVoiture = props.counter.counts.every((count) => count.voitureCount !== undefined);

const lastRecord = props.counter.counts[props.counter.counts.length - 1];
const lastRecordPreviousYear = getSameRecordPreviousYear(lastRecord);

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
</script>
