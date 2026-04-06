<template>
  <div class="relative bg-white pt-8 pb-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <div class="text-center">
        <h1 class="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">Chronologie des réalisations</h1>
        <p class="mt-4 text-xl text-gray-500">Suivi mois par mois des tronçons de {{ getRevName() }} livrés.</p>
      </div>

      <div class="mt-8 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          :class="
            selectedLines.size === 0 ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          "
          @click="clearLines()"
        >
          Toutes les lignes
        </button>
        <button
          v-for="line in getNbVoiesCyclables()"
          :key="line"
          type="button"
          class="w-8 h-8 rounded-full text-xs font-bold text-white transition-all"
          :class="
            selectedLines.size > 0 && !selectedLines.has(line) ? 'opacity-30 hover:opacity-60' : 'ring-2 ring-offset-1'
          "
          :style="{ backgroundColor: getLineColor(line), '--tw-ring-color': getLineColor(line) }"
          @click="toggleLine(line)"
        >
          {{ line }}
        </button>
      </div>

      <div class="mt-4 flex flex-wrap justify-center gap-2">
        <button
          v-if="hasOlderYears && !showAllYears"
          type="button"
          class="px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          @click="showAllYears = true"
        >
          {{ availableYears.length - recentYears.length }} années précédentes…
        </button>
        <button
          v-for="y in displayedYears"
          :key="y"
          type="button"
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
          :class="y === selectedYear ? 'bg-lvv-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          @click="selectYear(y)"
        >
          {{ y }}
          <span class="ml-1 text-xs opacity-75">({{ displayDistanceInKm(yearStats.get(y)?.distance ?? 0, 1) }})</span>
        </button>
      </div>

      <div class="mt-6 text-center text-gray-500">
        <span class="font-semibold text-gray-900">{{ yearSections.length }}</span> tronçons livrés en {{ selectedYear
        }}<template v-if="selectedLines.size > 0">
          sur
          {{
            Array.from(selectedLines)
              .sort((a, b) => a - b)
              .map((l) => `${getRevName('abbreviated')}${l}`)
              .join(', ')
          }}</template
        >, soit
        <span class="font-semibold text-gray-900">{{ displayDistanceInKm(yearDistance, 1) }}</span>
      </div>
      <div class="mt-2 text-center">
        <NuxtLink
          :to="yearMapLink"
          class="inline-flex items-center gap-1 text-sm text-lvv-blue-600 hover:underline font-medium"
        >
          Voir l'année {{ selectedYear }} sur la carte
          <Icon name="mdi:map-marker" class="h-4 w-4" />
        </NuxtLink>
      </div>

      <div class="mt-10 space-y-16">
        <div v-for="month in monthsForYear" :key="month.key">
          <NuxtLink
            :id="month.anchor"
            :to="`/chronologie/${month.anchor}`"
            class="flex items-center gap-3 mb-4 scroll-mt-20 group hover:no-underline"
            title="Ouvrir ce mois dans une page dédiée"
          >
            <div class="h-px flex-1 bg-gray-200" />
            <h2 class="text-lg font-bold text-gray-900 capitalize group-hover:text-lvv-blue-600 transition-colors">
              {{ month.label }}
            </h2>
            <span class="text-sm text-gray-400"
              >{{ month.sections.length }} tronçon{{ month.sections.length > 1 ? 's' : '' }}</span
            >
            <Icon
              name="mdi:open-in-new"
              class="h-4 w-4 text-gray-400 group-hover:text-lvv-blue-600 transition-colors"
            />
            <div class="h-px flex-1 bg-gray-200" />
          </NuxtLink>

          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="section in month.sections" :key="`${section.lines.join('-')}-${section.name}`">
              <button
                type="button"
                class="w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left"
                :class="
                  expandedKeys.has(sectionKey(section))
                    ? 'border-lvv-blue-300 shadow-sm bg-lvv-blue-50/30'
                    : 'border-gray-100 hover:border-lvv-blue-200 hover:shadow-sm'
                "
                @click="toggleExpand(section)"
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
                  <div class="text-sm font-medium text-gray-900 truncate">
                    {{ section.name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ section.typeName }} · {{ displayDistanceInKm(section.distance, 2) }}
                  </div>
                </div>
                <div class="flex-shrink-0 flex items-center gap-2">
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    :class="qualityClass(section.quality)"
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
        </div>

        <div v-if="monthsForYear.length === 0" class="text-center py-12 text-gray-400">
          Aucun tronçon livré en {{ selectedYear
          }}<template v-if="selectedLines.size > 0">
            sur
            {{
              Array.from(selectedLines)
                .sort((a, b) => a - b)
                .map((l) => `${getRevName('abbreviated')}${l}`)
                .join(', ')
            }}</template
          >.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVoiesCyclablesGeojson } from '~/composables/useVoiesCyclables';
import type { TimelineSection } from '~/composables/useTimeline';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

const { getRevName, getNbVoiesCyclables } = useConfig();
const { getLineColor } = useColors();
const { displayDistanceInKm } = useStats();

const route = useRoute();
const router = useRouter();

const { geojsons } = await useVoiesCyclablesGeojson();
const { allSections } = useTimeline(computed(() => geojsons.value));

const RECENT_YEARS_COUNT = 5;
const showAllYears = ref(false);

const availableYears = computed(() => {
  const years = new Set(allSections.value.map((s) => s.year));
  return Array.from(years).sort();
});

const recentYears = computed(() => availableYears.value.slice(-RECENT_YEARS_COUNT));
const hasOlderYears = computed(() => availableYears.value.length > RECENT_YEARS_COUNT);
const displayedYears = computed(() => (showAllYears.value ? availableYears.value : recentYears.value));

const yearStats = computed(() => {
  const stats = new Map<number, { distance: number }>();
  for (const section of filteredSections.value) {
    const existing = stats.get(section.year) || { distance: 0 };
    existing.distance += section.distance;
    stats.set(section.year, existing);
  }
  return stats;
});

const selectedYear = ref(parseInt(route.query.year as string) || new Date().getFullYear());
const selectedLines = ref(
  new Set<number>(
    route.query.line
      ? String(route.query.line)
          .split(',')
          .map(Number)
          .filter((n) => !isNaN(n))
      : [],
  ),
);

function selectYear(year: number) {
  selectedYear.value = year;
  expandedKeys.value.clear();
  router.replace({ query: { ...route.query, year: String(year) } });
}

function toggleLine(line: number) {
  if (selectedLines.value.has(line)) {
    selectedLines.value.delete(line);
  } else {
    selectedLines.value.add(line);
  }
  expandedKeys.value.clear();
  updateLineQuery();
}

function clearLines() {
  selectedLines.value.clear();
  expandedKeys.value.clear();
  updateLineQuery();
}

function updateLineQuery() {
  const query = { ...route.query };
  if (selectedLines.value.size > 0) {
    query.line = Array.from(selectedLines.value)
      .sort((a, b) => a - b)
      .join(',');
  } else {
    delete query.line;
  }
  router.replace({ query });
}

onMounted(() => {
  const monthParam = route.query.month as string;
  if (monthParam) {
    const anchor = `${selectedYear.value}-${monthParam.padStart(2, '0')}`;
    nextTick(() => {
      const el = document.getElementById(anchor);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
});

const filteredSections = computed(() => {
  if (selectedLines.value.size === 0) return allSections.value;
  return allSections.value.filter((s) => s.lines.some((l) => selectedLines.value.has(l)));
});

const yearSections = computed(() => filteredSections.value.filter((s) => s.year === selectedYear.value));
const yearDistance = computed(() => yearSections.value.reduce((sum, s) => sum + s.distance, 0));
const yearMapLink = computed(() => {
  const start = `${selectedYear.value}-01`;
  const lastMonth = yearSections.value.reduce((max, s) => Math.max(max, s.month), 0);
  const end = `${selectedYear.value}-${String(lastMonth + 1).padStart(2, '0')}`;
  return `/carte-interactive?modal=filters&start=${start}&end=${end}`;
});

const monthsForYear = computed(() => {
  const byMonth = new Map<number, TimelineSection[]>();
  for (const section of yearSections.value) {
    if (!byMonth.has(section.month)) byMonth.set(section.month, []);
    byMonth.get(section.month)!.push(section);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a - b)
    .map(([month, sections]) => ({
      key: `${selectedYear.value}-${month}`,
      anchor: `${selectedYear.value}-${String(month + 1).padStart(2, '0')}`,
      monthNum: month,
      label: dayjs(new Date(selectedYear.value, month)).format('MMMM YYYY'),
      sections,
    }));
});

const expandedKeys = ref(new Set<string>());

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

function qualityClass(quality: string): string {
  return quality === 'satisfactory' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
}

function formatDate(date: string): string {
  const [day, month, year] = date.split('/');
  return dayjs(new Date(+year!, +month! - 1, +day!)).format('D MMMM YYYY');
}
</script>
