<template>
  <div class="select-none" :class="textSizeClass">
    <div role="group" aria-label="Représentation du réseau" class="mb-2 flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
      <button
        v-for="mode in MAP_DISPLAY_MODES"
        :key="mode.id"
        type="button"
        :aria-pressed="mapDisplayMode === mode.id"
        :class="[
          mapDisplayMode === mode.id
            ? 'bg-white text-lvv-blue-600 font-semibold shadow-sm'
            : 'text-gray-500 hover:text-gray-800',
          'flex-1 rounded-md px-1 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lvv-blue-500',
        ]"
        @click="mapDisplayMode = mode.id"
      >
        {{ mode.label }}
      </button>
    </div>

    <div :class="hasTwoColumns ? 'grid grid-cols-2 gap-x-3 gap-y-0.5' : 'flex flex-col gap-0.5'">
      <div v-for="row in rows" :key="row.id" class="group flex items-center gap-0.5">
        <component
          :is="getRowFilter(row) ? 'button' : 'div'"
          :type="getRowFilter(row) ? 'button' : undefined"
          :aria-pressed="getRowFilter(row) ? isRowActive(row) : undefined"
          :title="getRowFilter(row) ? (isRowActive(row) ? 'Masquer' : 'Afficher') : undefined"
          :class="[
            'flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-0.5 text-left transition-opacity',
            getRowFilter(row)
              ? 'hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-lvv-blue-500'
              : '',
            isRowActive(row) ? '' : 'opacity-40',
          ]"
          @click="toggleRow(row)"
        >
          <div :class="['shrink-0', sampleWidthClass]">
            <div
              v-if="row.typeStyle?.crosses"
              class="flex items-center justify-around px-0.5"
              :style="{ color: row.typeStyle.color }"
            >
              <svg
                v-for="index in crossCount"
                :key="index"
                viewBox="0 0 8 8"
                :class="crossSizeClass"
                aria-hidden="true"
              >
                <path d="M1 1 7 7M7 1 1 7" fill="none" stroke="currentColor" stroke-width="2" />
              </svg>
            </div>

            <svg
              v-else-if="row.typeStyle"
              :viewBox="`0 0 ${sampleWidth} ${sampleHeight}`"
              :width="sampleWidth"
              :height="sampleHeight"
              class="block"
              aria-hidden="true"
            >
              <line
                v-for="offset in getSampleOffsets(row.typeStyle)"
                :key="offset"
                :x1="row.typeStyle.dotted ? row.typeStyle.width * sampleScale : 0"
                :x2="sampleWidth"
                :y1="sampleHeight / 2 + offset"
                :y2="sampleHeight / 2 + offset"
                :stroke="row.typeStyle.color"
                :stroke-width="row.typeStyle.width * sampleScale"
                :stroke-dasharray="getSampleDasharray(row.typeStyle)"
                :stroke-linecap="row.typeStyle.dotted ? 'round' : 'butt'"
              />
            </svg>

            <div v-else-if="row.id === 'done'" :class="['rounded-md border-gray-500 border', borderClass]">
              <div :class="['bg-lvv-blue-600', lineHeightClass]" />
            </div>

            <div v-else-if="row.id === 'wip'" :class="['rounded-md border-gray-500 border relative', borderClass]">
              <div :class="['relative overflow-hidden', lineHeightClass]">
                <div
                  class="absolute h-full w-[200%] -left-1/2 bg-lvv-blue-600 dashed-line"
                  :class="{ 'animated-dashes': !reduceMotion }"
                />
              </div>
              <img
                v-if="reduceMotion && constructionIconUrl"
                :src="constructionIconUrl"
                alt=""
                :class="[
                  'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none',
                  constructionIconSizeClass,
                ]"
              />
            </div>

            <div v-else-if="row.id === 'planned'" :class="['rounded-md border-gray-500 border', borderClass]">
              <div :class="['relative', lineHeightClass]">
                <div class="absolute h-full w-full">
                  <div class="h-full bg-lvv-blue-600 dashed-line-planned" />
                </div>
              </div>
            </div>

            <div
              v-else-if="row.id === 'priority-2030'"
              :class="['rounded-md border-gray-500 border overflow-hidden', borderClass]"
            >
              <div
                :class="[
                  mapDisplayMode === 'status' ? 'bg-lvv-pink/25' : 'bg-lvv-blue-600/25',
                  'py-1 border-y-2 border-lvv-pink',
                ]"
              >
                <div v-if="mapDisplayMode === 'status'" :class="['bg-lvv-pink', lineHeightClass]" />
                <div v-else :class="['relative', lineHeightClass]">
                  <div class="absolute inset-0 flex items-center justify-around px-0.5 text-lvv-blue-600">
                    <svg
                      v-for="index in crossCount"
                      :key="index"
                      viewBox="0 0 8 8"
                      :class="crossSizeClass"
                      aria-hidden="true"
                    >
                      <path d="M1 1 7 7M7 1 1 7" fill="none" stroke="currentColor" stroke-width="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else-if="row.id === 'postponed' && mapDisplayMode === 'status'"
              :class="['rounded-md border-gray-500 border', borderClass]"
            >
              <div :class="['bg-lvv-pink', lineHeightClass]" />
            </div>

            <div
              v-else-if="row.id === 'postponed'"
              :class="['rounded-md border-gray-500 border relative', borderClass]"
            >
              <div :class="['bg-white', lineHeightClass]" />
              <div class="absolute inset-0 flex items-center justify-around px-0.5 text-lvv-blue-600">
                <svg
                  v-for="index in crossCount"
                  :key="index"
                  viewBox="0 0 8 8"
                  :class="crossSizeClass"
                  aria-hidden="true"
                >
                  <path d="M1 1 7 7M7 1 1 7" fill="none" stroke="currentColor" stroke-width="2" />
                </svg>
              </div>
            </div>

            <div v-else-if="row.id === 'variante'" :class="['rounded-md border-gray-500 border', borderClass]">
              <div :class="['bg-lvv-blue-600', lineHeightClass]" :style="{ opacity: VARIANTE_OPACITY }" />
            </div>
          </div>
          <span :class="{ 'whitespace-nowrap': hasTwoColumns }">{{ row.label }}</span>
        </component>
        <button
          v-if="getRowFilter(row)"
          type="button"
          :title="isRowAlone(row) ? 'Tout afficher' : 'N\'afficher que cette catégorie'"
          :aria-label="isRowAlone(row) ? 'Tout afficher' : `N'afficher que ${row.label}`"
          :class="[
            isRowAlone(row) ? 'text-lvv-blue-600 opacity-100' : 'text-gray-400 opacity-0',
            'shrink-0 rounded p-0.5 transition-opacity hover:text-lvv-blue-600 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-lvv-blue-500 group-hover:opacity-100 [@media(hover:none)]:opacity-100',
          ]"
          @click="showOnlyRow(row)"
        >
          <svg
            viewBox="0 0 24 24"
            :class="focusIconSizeClass"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
          </svg>
        </button>
      </div>
    </div>

    <button
      v-if="hasHiddenRows"
      type="button"
      class="mt-1 px-1 text-gray-500 underline hover:text-lvv-blue-600"
      @click="showAllRows"
    >
      Tout afficher
    </button>
  </div>
</template>

<script setup lang="ts">
import { LANE_TYPE_STYLES, MAP_DISPLAY_MODES, getLaneTypeDasharray, type LaneTypeStyle } from '~/helpers/map-display';
import { VARIANTE_OPACITY, createConstructionIcon } from '~/helpers/map-utils';
import type { FilterActions, FiltersState, LaneStatus, StatusTypeQualityFilterItem } from '~/types';

type LegendRow = { id: string; label: string; status?: LaneStatus; typeStyle?: LaneTypeStyle };
type RowFilter = {
  item: StatusTypeQualityFilterItem;
  items: StatusTypeQualityFilterItem[];
  dependencies: StatusTypeQualityFilterItem[];
};

const STATUS_ROWS: LegendRow[] = [
  { id: 'done', label: 'terminé', status: 'done' },
  { id: 'wip', label: 'en travaux', status: 'wip' },
  { id: 'planned', label: 'prévu', status: 'planned' },
  { id: 'priority-2030', label: 'priorité 2030', status: 'priority-2030' },
  { id: 'postponed', label: 'souhaité', status: 'postponed' },
  { id: 'variante', label: 'variante' },
];

const TYPE_ROWS: LegendRow[] = LANE_TYPE_STYLES.map((style) => ({
  id: style.id,
  label: style.label,
  typeStyle: style,
}));

const ALL_ROWS = [...STATUS_ROWS, ...TYPE_ROWS];

const props = withDefaults(
  defineProps<{
    size?: 'small' | 'large';
    filters?: FiltersState;
    actions?: FilterActions;
  }>(),
  {
    size: 'large',
    filters: undefined,
    actions: undefined,
  },
);

const { reduceMotion, mapDisplayMode } = useSettings();

const constructionIconUrl = ref('');
onMounted(() => {
  constructionIconUrl.value = createConstructionIcon(Math.ceil(window.devicePixelRatio)).toDataURL();
});

const rows = computed(() => (mapDisplayMode.value === 'type' ? TYPE_ROWS : STATUS_ROWS));
const hasTwoColumns = computed(() => props.size === 'small' && mapDisplayMode.value === 'type');

function getRowFilter(row: LegendRow): RowFilter | null {
  if (!props.filters || !props.actions) {
    return null;
  }
  if (row.status) {
    const items = props.filters.statusFilters.value;
    const item = items.find((filter) => filter.statuses?.includes(row.status!));
    return item ? { item, items, dependencies: [] } : null;
  }
  if (row.typeStyle) {
    const items = props.filters.typeFilters.value;
    const item = items.find((filter) => filter.id === row.typeStyle!.id);
    const quality = row.typeStyle.quality;
    const dependencies = quality
      ? props.filters.qualityFilters.value.filter((filter) => filter.qualities?.includes(quality))
      : [];
    return item ? { item, items, dependencies } : null;
  }
  return null;
}

function isFilterActive(filter: RowFilter): boolean {
  return filter.item.isEnabled && filter.dependencies.every((dependency) => dependency.isEnabled);
}

function setFilterVisible(filter: RowFilter, visible: boolean) {
  filter.item.isEnabled = visible;
  if (visible) {
    filter.dependencies.forEach((dependency) => (dependency.isEnabled = true));
  }
}

function isRowActive(row: LegendRow): boolean {
  const filter = getRowFilter(row);
  return filter ? isFilterActive(filter) : true;
}

function toggleRow(row: LegendRow) {
  const filter = getRowFilter(row);
  if (filter) {
    setFilterVisible(filter, !isFilterActive(filter));
  }
}

function isRowAlone(row: LegendRow): boolean {
  const filter = getRowFilter(row);
  return !!filter && isFilterActive(filter) && filter.items.every((item) => item === filter.item || !item.isEnabled);
}

function showOnlyRow(row: LegendRow) {
  const filter = getRowFilter(row);
  if (!filter) {
    return;
  }
  const showAll = isRowAlone(row);
  for (const item of filter.items) {
    item.isEnabled = showAll || item === filter.item;
  }
  setFilterVisible(filter, true);
}

const hasHiddenRows = computed(() => ALL_ROWS.some((row) => !isRowActive(row)));

function showAllRows() {
  for (const row of ALL_ROWS) {
    const filter = getRowFilter(row);
    if (filter) {
      setFilterVisible(filter, true);
    }
  }
}

const textSizeClass = computed(() => (props.size === 'small' ? 'text-xs' : 'text-sm'));
const focusIconSizeClass = computed(() => (props.size === 'small' ? 'h-3 w-3' : 'h-4 w-4'));
const sampleWidthClass = computed(() => (props.size === 'small' ? 'w-12' : 'w-16'));
const lineHeightClass = computed(() => (props.size === 'small' ? 'h-0.5' : 'h-1'));
const borderClass = computed(() => (props.size === 'small' ? 'rounded-sm' : 'rounded-md'));
const constructionIconSizeClass = computed(() => (props.size === 'small' ? 'h-4 w-4' : 'h-5 w-5'));
const crossCount = computed(() => (props.size === 'small' ? 4 : 5));
const crossSizeClass = computed(() => (props.size === 'small' ? 'h-1.5 w-1.5' : 'h-2 w-2'));
const sampleScale = computed(() => (props.size === 'small' ? 1 : 1.25));
const sampleWidth = computed(() => (props.size === 'small' ? 48 : 64));
const sampleHeight = computed(() => (props.size === 'small' ? 8 : 10));

function getSampleOffsets(style: LaneTypeStyle): number[] {
  if (!style.gapWidth) {
    return [0];
  }
  const offset = ((style.gapWidth + style.width) / 2) * sampleScale.value;
  return [-offset, offset];
}

function getSampleDasharray(style: LaneTypeStyle): string | undefined {
  return getLaneTypeDasharray(style)
    ?.map((length) => length * style.width * sampleScale.value)
    .join(' ');
}
</script>

<style scoped>
.dashed-line {
  background-image: linear-gradient(to right, transparent 50%, white 50%);
  background-position: 0 0;
  background-repeat: repeat-x;
  background-size: 12px 0.25rem;
  will-change: transform;
}

.dashed-line-planned {
  background-image: linear-gradient(to right, transparent 33%, white 33%);
  background-position: 0 0;
  background-repeat: repeat-x;
  background-size: 12px 0.25rem;
}

.animated-dashes {
  animation: dash-animation 0.5s linear infinite;
}

@keyframes dash-animation {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(12px);
  }
}
</style>
