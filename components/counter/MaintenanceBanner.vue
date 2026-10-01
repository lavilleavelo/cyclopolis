<template>
  <p
    v-if="message"
    class="not-prose text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-4 text-center"
  >
    <Icon name="mdi:wrench" class="text-amber-600 align-text-bottom" />
    {{ message }}
  </p>
</template>

<script setup lang="ts">
import { formatDay, useCounterDetailedStats, type CounterRef } from '~/composables/useCounterDetailedStats';

const SILENT_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const props = defineProps<{
  counts: { month: string; count: number }[];
  counter?: CounterRef | null;
}>();

const { isCountsInMaintenance } = useCounterUtils();

const stats = props.counter ? useCounterDetailedStats(props.counter).data : ref(null);

const silentSince = computed(() => {
  const lastDay = stats.value?.lastDay;
  if (!lastDay) {
    return null;
  }

  const lastTimestamp = Date.parse(`${lastDay}T00:00:00Z`);
  if (Date.now() - lastTimestamp <= (SILENT_DAYS + 1) * DAY_MS) {
    return null;
  }

  return new Date(lastTimestamp + DAY_MS).toISOString().slice(0, 10);
});

const message = computed(() => {
  if (silentSince.value) {
    return `Ce compteur ne transmet plus de données depuis le ${formatDay(silentSince.value)}.`;
  }

  return isCountsInMaintenance(props.counts) ? 'Compteur en maintenance · données partielles ou incomplètes' : null;
});
</script>
