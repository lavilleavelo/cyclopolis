<template>
  <component :is="tag" :id="id" class="scroll-mt-[120px]">
    <a v-if="id" class="not-prose" :href="`#${id}`">
      <slot />
    </a>
  </component>

  <div v-if="propertiesArray && propertiesArray.length > 0" class="my-4 mb-6 flex flex-col gap-4">
    <!-- Single segment -->
    <template v-if="propertiesArray.length === 1 && firstProperty">
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap gap-2 items-center">
          <span
            class="inline-flex items-center px-3 py-1.5 rounded-md text-[0.8125rem] font-medium leading-5 shadow-sm transition-all duration-150 opacity-95 hover:opacity-100 hover:shadow-md text-white"
            :class="getStatusBadgeClasses(firstProperty.status)"
          >
            {{ getStatusLabel(firstProperty.status) }}
            <span
              v-if="(firstProperty.status === 'done' || firstProperty.status === 'postponed') && firstProperty.doneAt"
              class="ml-2 pl-2 border-l border-white/25 font-normal text-xs opacity-90"
            >
              {{ formatDateLong(firstProperty.doneAt, firstProperty.status) }}
            </span>
          </span>
          <span class="inline-flex items-center px-3 py-1.5 rounded-md text-[0.8125rem] font-medium leading-5 shadow-sm transition-all duration-150 opacity-95 hover:opacity-100 hover:shadow-md bg-gray-50 text-gray-700 border border-gray-200">
            {{ getTypeLabel(firstProperty.type) }}
          </span>
          <span
            v-if="firstProperty.quality"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[0.8125rem] font-medium leading-5 shadow-sm transition-all duration-150 opacity-95 hover:opacity-100 hover:shadow-md bg-white"
            :class="firstProperty.quality === 'satisfactory' ? 'border border-green-600 text-green-600' : 'border border-red-600 text-red-600'"
          >
            <span v-if="firstProperty.quality === 'satisfactory'">✓</span>
            <span v-else>✗</span>
            {{ getQualityLabel(firstProperty.quality) }}
          </span>
          <NuxtLink
            :to="`/carte-interactive?line=${firstProperty.line}&sectionName=${encodeURIComponent(firstProperty.name)}`"
            class="inline-block mt-0 ml-2 text-blue-500 no-underline text-sm font-medium transition-colors duration-150 hover:text-blue-600 hover:underline whitespace-nowrap"
            title="Voir cette section sur la carte interactive"
          >
            Voir sur la carte
          </NuxtLink>
        </div>
      </div>
    </template>

    <!-- Multiple segments -->
    <details v-else-if="summary" class="border border-gray-200 rounded-lg">
      <summary class="cursor-pointer list-none grid grid-cols-[auto_1fr] gap-3 p-2 items-start rounded-md transition-colors duration-150 bg-gray-50 hover:bg-gray-100 [&::-webkit-details-marker]:hidden marker:content-[''] before:content-['›'] before:flex before:items-center before:justify-center before:w-5 before:h-5 before:mt-0.5 before:transition-transform before:duration-200 before:text-xl before:font-bold before:text-gray-500 before:leading-none">
        <div class="flex flex-col gap-2 min-w-0">
          <span class="text-[0.8125rem] text-gray-500 font-medium whitespace-nowrap">Ce tronçon est composé de {{ propertiesArray.length }} segments</span>

          <div class="flex flex-wrap gap-2 items-center">
            <span
              class="inline-flex items-center px-3 py-1.5 rounded-md text-[0.8125rem] font-medium leading-5 shadow-sm transition-all duration-150 opacity-95 hover:opacity-100 hover:shadow-md text-white"
              :class="getStatusBadgeClasses(summary.primaryStatus)"
            >
              {{ summary.statusLabel }}
              <span
                v-if="summary.dateRange"
                class="ml-2 pl-2 border-l border-white/25 font-normal text-xs opacity-90"
              >
                {{ summary.dateRange }}
              </span>
            </span>
            <span class="inline-flex items-center px-3 py-1.5 rounded-md text-[0.8125rem] font-medium leading-5 shadow-sm transition-all duration-150 opacity-95 hover:opacity-100 hover:shadow-md bg-gray-50 text-gray-700 border border-gray-200">
              {{ summary.typeLabel }}
            </span>
            <span
              v-if="summary.qualityLabel"
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[0.8125rem] font-medium leading-5 shadow-sm transition-all duration-150 opacity-95 hover:opacity-100 hover:shadow-md"
              :class="summary.qualityLabel === 'Qualité variable' ? 'bg-gray-50 text-gray-700 border border-gray-200' : `bg-white ${summary.primaryQuality === 'satisfactory' ? 'border border-green-600 text-green-600' : 'border border-red-600 text-red-600'}`"
            >
              <template v-if="summary.qualityLabel === 'Qualité variable'">
                {{ summary.qualityLabel }}
              </template>
              <template v-else>
                <span v-if="summary.primaryQuality === 'satisfactory'">✓</span>
                <span v-else>✗</span>
                {{ summary.qualityLabel }}
              </template>
            </span>
          </div>
        </div>
      </summary>

      <div class="border-t border-gray-200 flex flex-col gap-4 p-3">
        <div v-for="(properties, index) in propertiesArray" :key="index" class="flex flex-col gap-2 pb-4 border-b border-gray-200 last:pb-0 last:border-b-0">
          <div class="flex items-center gap-3 mb-2">
            <div class="text-sm font-semibold text-gray-700">
              {{ properties.name }}
            </div>
            <NuxtLink
              :to="`/carte-interactive?line=${properties.line}&sectionName=${encodeURIComponent(properties.name)}`"
              class="inline-block ml-auto mt-0 text-blue-500 no-underline text-sm font-medium transition-colors duration-150 hover:text-blue-600 hover:underline whitespace-nowrap"
              title="Voir cette section sur la carte interactive"
            >
              Voir sur la carte
            </NuxtLink>
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            <span
              class="inline-flex items-center px-3 py-1.5 rounded-md text-[0.8125rem] font-medium leading-5 shadow-sm transition-all duration-150 opacity-95 hover:opacity-100 hover:shadow-md text-white"
              :class="getStatusBadgeClasses(properties.status)"
            >
              {{ getStatusLabel(properties.status) }}
              <span
                v-if="(properties.status === 'done' || properties.status === 'postponed') && properties.doneAt"
                class="ml-2 pl-2 border-l border-white/25 font-normal text-xs opacity-90"
              >
                {{ formatDateLong(properties.doneAt, properties.status) }}
              </span>
            </span>
            <span class="inline-flex items-center px-3 py-1.5 rounded-md text-[0.8125rem] font-medium leading-5 shadow-sm transition-all duration-150 opacity-95 hover:opacity-100 hover:shadow-md bg-gray-50 text-gray-700 border border-gray-200">
              {{ getTypeLabel(properties.type) }}
            </span>
            <span
              v-if="properties.quality"
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[0.8125rem] font-medium leading-5 shadow-sm transition-all duration-150 opacity-95 hover:opacity-100 hover:shadow-md bg-white"
              :class="properties.quality === 'satisfactory' ? 'border border-green-600 text-green-600' : 'border border-red-600 text-red-600'"
            >
              <span v-if="properties.quality === 'satisfactory'">✓</span>
              <span v-else>✗</span>
              {{ getQualityLabel(properties.quality) }}
            </span>
          </div>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import type { LineStringFeature, LaneStatus } from '~/types';

const props = defineProps<{
  id?: string;
  tag: 'h3' | 'h4';
}>();

const { getStatusLabel, getTypeLabel, getQualityLabel, formatDateLong } = useStatusLabels();

const getStatusBadgeClasses = (status: LaneStatus) => {
  const classMap: Record<LaneStatus, string> = {
    done: 'bg-emerald-600 text-emerald-50',
    wip: 'bg-amber-600 text-amber-50',
    planned: 'bg-cyan-600 text-cyan-50',
    tested: 'bg-violet-600 text-violet-50',
    postponed: 'bg-slate-500 text-slate-50',
    variante: 'bg-teal-500 text-teal-50',
    'variante-postponed': 'bg-stone-600 text-stone-50',
    unknown: 'bg-gray-400 text-gray-50',
  };
  return classMap[status] || classMap.unknown;
};

const sectionProperties = inject<ComputedRef<Map<string, LineStringFeature['properties'][]>>>('sectionProperties', computed(() => new Map()));

const propertiesArray = computed(() => {
  if (!props.id || !sectionProperties.value) return null;
  return sectionProperties.value.get(props.id) || null;
});

const firstProperty = computed(() => {
  return propertiesArray.value?.[0] || null;
});

const summary = computed(() => {
  if (!propertiesArray.value || propertiesArray.value.length <= 1) {
    return null;
  }

  const props = propertiesArray.value;

  // Analyze statuses
  const statuses = props.map(p => p.status).filter(Boolean);
  const uniqueStatuses = [...new Set(statuses)];

  let primaryStatus: LaneStatus;
  let statusLabel: string;

  if (uniqueStatuses.length === 1) {
    primaryStatus = uniqueStatuses[0] || 'unknown';
    statusLabel = getStatusLabel(primaryStatus);
  } else {
    primaryStatus = uniqueStatuses[0] || 'unknown';

    if (uniqueStatuses.includes('done') && uniqueStatuses.length > 1) {
      statusLabel = 'Partiellement terminé';
    } else if (uniqueStatuses.includes('wip') && uniqueStatuses.length > 1) {
      statusLabel = 'Partiellement en travaux';
    } else if (uniqueStatuses.includes('planned') && uniqueStatuses.length > 1) {
      statusLabel = 'Prévu en partie pour 2026';
    } else if (uniqueStatuses.includes('postponed') && uniqueStatuses.length > 1) {
      statusLabel = 'Reporté en partie après 2026';
    } else {
      statusLabel = 'Statut variable';
    }
  }

  const hasPostponed = uniqueStatuses.includes('postponed') || uniqueStatuses.includes('variante-postponed');

  const dates = props
    .filter(p => p.doneAt)
    .map(p => p.doneAt!)
    .sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'));
      const dateB = new Date(b.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });

  let dateRange = '';
  if (dates.length > 0 && !hasPostponed) {
    const firstDateStr = dates[0];
    const lastDateStr = dates[dates.length - 1];

    if (dates.length === 1 && firstDateStr) {
      dateRange = formatDateLong(firstDateStr, primaryStatus);
    } else if (firstDateStr && lastDateStr) {
      if (firstDateStr === lastDateStr) {
        dateRange = formatDateLong(firstDateStr, primaryStatus);
      } else {
        const firstDate = new Date(firstDateStr.split('/').reverse().join('-'));
        const lastDate = new Date(lastDateStr.split('/').reverse().join('-'));

        if (firstDate.getFullYear() === lastDate.getFullYear()) {
          dateRange = `${firstDate.toLocaleDateString('fr-FR', { month: 'long' })} à ${lastDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
        } else {
          dateRange = `${firstDate.getFullYear()} à ${lastDate.getFullYear()}`;
        }
      }
    }
  }

  const types = props.map(p => p.type).filter(Boolean);
  const uniqueTypes = [...new Set(types)];
  const typeLabel = uniqueTypes.length > 3
    ? 'Type d\'aménagement variable'
    : uniqueTypes.map(t => getTypeLabel(t!)).join(', ');

  const qualities = props.map(p => p.quality).filter(Boolean);
  const uniqueQualities = [...new Set(qualities)];
  const primaryQuality = qualities[0] || 'satisfactory';
  const qualityLabel = uniqueQualities.length >= 2
    ? 'Qualité variable'
    : uniqueQualities.length === 1
      ? getQualityLabel(uniqueQualities[0]!)
      : null;

  return {
    primaryStatus,
    statusLabel,
    dateRange,
    typeLabel,
    qualityLabel,
    primaryQuality,
  };
});
</script>

