<template>
  <div class="relative bg-white pt-8 pb-20 overflow-x-hidden">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <NuxtLink to="/chronologie" class="inline-flex items-center gap-1 text-sm text-lvv-blue-600 hover:underline">
          <Icon name="mdi:arrow-left" class="h-4 w-4" />
          Retour à la chronologie
        </NuxtLink>
        <h1 class="mt-4 text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl capitalize">
          {{ monthLabel }}
        </h1>
        <p class="mt-4 text-xl text-gray-500">
          <span class="font-semibold text-gray-900">{{ sections.length }}</span> tronçons livrés, soit
          <span class="font-semibold text-gray-900">{{ displayDistanceInKm(totalDistance, 1) }}</span>
        </p>
        <NuxtLink
          :to="mapLink"
          class="mt-3 inline-flex items-center gap-1 text-sm text-lvv-blue-600 hover:underline font-medium"
        >
          Voir sur la carte interactive
          <Icon name="mdi:map-marker" class="h-4 w-4" />
        </NuxtLink>
      </div>
    </div>

    <div v-if="allFeatures.length" class="mt-8 overflow-hidden border-y border-gray-200" style="height: 400px">
      <ClientOnly fallback-tag="div">
        <template #fallback>
          <div class="h-full w-full bg-gray-100 animate-pulse" />
        </template>
        <Map
          :features="allFeatures"
          :highlighted-sections="hoveredSections"
          :options="{ roundedCorners: false, legend: false, filter: false, logo: false, cooperativeGestures: true }"
          style="height: 400px"
        />
      </ClientOnly>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mt-10 grid gap-3 sm:grid-cols-2">
        <div v-for="section in sections" :key="`${section.lines.join('-')}-${section.name}`" class="min-w-0">
          <button
            type="button"
            class="w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left"
            :class="
              expandedKeys.has(sectionKey(section))
                ? 'border-lvv-blue-300 shadow-sm bg-lvv-blue-50/30'
                : 'border-gray-100 hover:border-lvv-blue-200 hover:shadow-sm'
            "
            @click="toggleExpand(section)"
            @mouseenter="hoveredSection = section"
            @mouseleave="hoveredSection = null"
          >
            <div class="flex-shrink-0 flex gap-1">
              <div
                v-for="line in section.lines"
                :key="line"
                class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                :style="{ backgroundColor: getLineColor(line) }"
              >
                {{ line }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 truncate">{{ section.name }}</div>
              <div class="text-xs text-gray-500">
                {{ section.typeName }} · {{ displayDistanceInKm(section.distance, 2) }}
                <span class="sm:hidden">
                  ·
                  <span :class="section.quality === 'satisfactory' ? 'text-green-600' : 'text-red-600'">
                    {{ section.quality === 'satisfactory' ? 'Satisfaisant' : 'Non satisfaisant' }}
                  </span>
                </span>
              </div>
            </div>
            <div class="flex-shrink-0 flex items-center gap-2">
              <span
                class="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                :class="section.quality === 'satisfactory' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                {{ section.quality === 'satisfactory' ? 'Satisfaisant' : 'Non satisfaisant' }}
              </span>
              <Icon
                name="mdi:chevron-down"
                class="h-4 w-4 text-gray-400 transition-transform"
                :class="{ 'rotate-180': expandedKeys.has(sectionKey(section)) }"
              />
            </div>
          </button>

          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-[500px]"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 max-h-[500px]"
            leave-to-class="opacity-0 max-h-0"
          >
            <div v-if="expandedKeys.has(sectionKey(section))" class="overflow-hidden">
              <div class="mt-2 rounded-lg overflow-hidden border border-gray-200">
                <ClientOnly>
                  <Map
                    :features="section.features"
                    :options="{
                      roundedCorners: true,
                      legend: false,
                      filter: false,
                      logo: false,
                      cooperativeGestures: true,
                    }"
                    style="height: 300px"
                  />
                </ClientOnly>
                <div class="px-3 py-3 bg-gray-50 space-y-2">
                  <div class="text-xs text-gray-500">Livré le {{ formatDate(section.date) }}</div>
                  <div class="flex flex-wrap gap-2">
                    <a
                      v-for="pl in section.pageLinks"
                      :key="pl.line"
                      :href="pl.href"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white no-underline hover:opacity-80 transition-opacity"
                      :style="{ backgroundColor: getLineColor(pl.line) }"
                    >
                      {{ getRevName('abbreviated') }}{{ pl.line }}
                      <Icon name="mdi:arrow-right" class="h-3.5 w-3.5" />
                    </a>
                    <a
                      :href="section.mapLink"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-lvv-blue-50 text-lvv-blue-600 no-underline hover:bg-lvv-blue-100 transition-colors"
                    >
                      Voir sur la carte
                      <Icon name="mdi:map-marker" class="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div v-if="sections.length === 0" class="text-center py-12 text-gray-400">Aucun tronçon livré ce mois-ci.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVoiesCyclablesGeojson } from '~/composables/useVoiesCyclables';
import type { TimelineSection } from '~/composables/useTimeline';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

const { getRevName } = useConfig();
const { getLineColor } = useColors();
const { displayDistanceInKm } = useStats();

const { params } = useRoute();
const slug = params.slug as string;
const [yearStr, monthStr] = slug.split('-');
const year = parseInt(yearStr!);
const month = parseInt(monthStr!) - 1; // 0-indexed

const { geojsons } = await useVoiesCyclablesGeojson();
const { allSections } = useTimeline(computed(() => geojsons.value));

const sections = computed(() => allSections.value.filter((s) => s.year === year && s.month === month));
const totalDistance = computed(() => sections.value.reduce((sum, s) => sum + s.distance, 0));
const allFeatures = computed(() => sections.value.flatMap((s) => s.features));

const monthLabel = dayjs(new Date(year, month)).locale('fr').format('MMMM YYYY');

const startParam = `${year}-${monthStr!.padStart(2, '0')}`;
const endParam = startParam;
const mapLink = `/carte-interactive?modal=filters&start=${startParam}&end=${endParam}`;

const expandedKeys = ref(new Set<string>());
const hoveredSection = ref<TimelineSection | null>(null);

const hoveredSections = computed(() => {
  if (!hoveredSection.value) return null;
  return hoveredSection.value.lines.map((line) => ({ line, sectionName: hoveredSection.value!.name }));
});

function sectionKey(section: TimelineSection): string {
  return `${section.lines.join('-')}-${section.name}-${section.date}`;
}

function toggleExpand(section: TimelineSection) {
  const key = sectionKey(section);
  if (expandedKeys.value.has(key)) {
    expandedKeys.value.delete(key);
  } else {
    expandedKeys.value.add(key);
  }
}

function formatDate(date: string): string {
  const [day, m, y] = date.split('/');
  return dayjs(new Date(+y!, +m! - 1, +day!))
    .locale('fr')
    .format('D MMMM YYYY');
}

useHead({ title: `Chronologie — ${monthLabel}` });
</script>
