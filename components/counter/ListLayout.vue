<template>
  <div>
    <div class="relative bg-white pt-8 pb-6 px-4 sm:px-6 lg:pt-12 lg:pb-6 lg:px-8">
      <div class="relative max-w-7xl mx-auto">
        <div class="text-center">
          <slot name="header" />
        </div>
      </div>
    </div>

    <div v-show="showMap" class="lg:sticky lg:z-30" style="top: var(--navbar-height, 0px)">
      <div class="relative">
        <ClientOnly fallback-tag="div">
          <template #fallback>
            <MapPlaceholder style="height: 40vh" />
          </template>
          <Map
            :features="filteredFeatures"
            :options="{ roundedCorners: false, legend: false, filter: false, cooperativeGestures: true }"
            style="height: 40vh"
            :highlighted-counter="highlightedCounter"
          />
        </ClientOnly>

        <div class="absolute top-2 right-2 z-10 flex gap-2">
          <button
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium shadow-md transition-colors"
            :class="
              showVoiesLyonnaises
                ? 'bg-lvv-blue-600 text-white hover:bg-lvv-blue-700'
                : 'bg-white/90 text-gray-700 hover:bg-white backdrop-blur-sm'
            "
            @click="showVoiesLyonnaises = !showVoiesLyonnaises"
          >
            <Icon name="game-icons:dutch-bike" class="text-base" />
            Voies Lyonnaises
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium shadow-md transition-colors bg-white/90 text-gray-700 hover:bg-white backdrop-blur-sm"
            title="Masquer la carte"
            @click="showMap = false"
          >
            <Icon name="mdi:eye-off-outline" class="text-base" />
            <span class="hidden sm:inline">Masquer la carte</span>
          </button>
        </div>
        <div
          class="hidden lg:block absolute bottom-3 left-0 right-0 px-4 sm:px-6 lg:px-8 bg-gradient-to-t from-white/50 to-transparent pt-6 pb-1"
        >
          <div class="max-w-7xl mx-auto">
            <label for="compteur-lg" class="sr-only">Compteur</label>
            <div class="relative rounded-md shadow-md">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Icon name="mdi:magnify" class="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="compteur-lg"
                :value="searchText"
                type="text"
                class="py-3 pl-10 pr-4 text-lg focus:ring-lvv-blue-600 focus:border-lvv-blue-600 block w-full border-gray-300 text-gray-900 rounded-md bg-white/80 backdrop-blur-sm"
                :placeholder="searchPlaceholder"
                @input="searchText = ($event.target as HTMLInputElement).value"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div :class="[showMap ? 'lg:hidden' : '', 'px-4 sm:px-6 py-3 bg-white shadow-sm']">
      <div class="flex items-center gap-2">
        <div class="relative flex-1 rounded-md shadow-sm">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="mdi:magnify" class="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <input
            id="compteur-sm"
            :value="searchText"
            type="text"
            class="py-3 pl-10 pr-4 text-lg focus:ring-lvv-blue-600 focus:border-lvv-blue-600 block w-full border-gray-300 text-gray-900 rounded-md"
            :placeholder="searchPlaceholder"
            @input="searchText = ($event.target as HTMLInputElement).value"
          />
        </div>
        <button
          v-if="!showMap"
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 whitespace-nowrap"
          @click="showMap = true"
        >
          <Icon name="mdi:map-outline" class="text-base" />
          <span class="hidden sm:inline">Afficher la carte</span>
        </button>
      </div>
    </div>

    <div class="relative px-4 sm:px-6 lg:px-8 py-6 bg-gray-50">
      <div class="max-w-7xl mx-auto">
        <slot name="overview" />
        <div v-if="hasActiveFilters" class="flex justify-end mb-2">
          <button
            type="button"
            class="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            title="Réinitialiser les filtres"
            @click="resetFilters"
          >
            <Icon name="mdi:filter-off-outline" class="text-base" />
            <span>Réinitialiser les filtres</span>
          </button>
        </div>
        <div
          class="grid grid-cols-2 gap-x-4 gap-y-3 mb-4 md:grid-cols-[repeat(auto-fit,minmax(115px,1fr))] md:gap-x-3 md:items-end lg:flex lg:flex-wrap lg:items-center lg:justify-end lg:gap-x-4 lg:gap-y-2"
        >
          <div class="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
            <span class="text-xs text-gray-500 whitespace-nowrap lg:text-sm">Période</span>
            <div class="inline-flex self-start rounded-md shadow-sm" role="group">
              <button
                type="button"
                :class="[
                  'px-2.5 py-1.5 text-sm font-medium rounded-l-md border border-gray-300 transition-colors',
                  comparisonPeriod === 'monthly'
                    ? 'bg-lvv-blue-600 text-white border-lvv-blue-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50',
                ]"
                @click="comparisonPeriod = 'monthly'"
              >
                Mensuel
              </button>
              <button
                type="button"
                :class="[
                  'px-2.5 py-1.5 text-sm font-medium rounded-r-md border border-l-0 border-gray-300 transition-colors',
                  comparisonPeriod === 'annual'
                    ? 'bg-lvv-blue-600 text-white border-lvv-blue-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50',
                ]"
                @click="comparisonPeriod = 'annual'"
              >
                Annuel
              </button>
            </div>
          </div>
          <div
            v-if="comparisonPeriod === 'monthly'"
            class="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2 lg:min-w-[11rem]"
          >
            <label for="month-select" class="text-xs text-gray-500 whitespace-nowrap lg:text-sm">Mois</label>
            <select
              id="month-select"
              v-model="selectedMonth"
              class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-lvv-blue-600 focus:border-lvv-blue-600 py-1.5 pl-3 pr-8 lg:w-auto"
            >
              <option v-for="m in availableMonths" :key="m" :value="m">{{ formatMonthOption(m) }}</option>
            </select>
          </div>
          <div v-else class="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2 lg:min-w-[11rem]">
            <label for="year-select" class="text-xs text-gray-500 whitespace-nowrap lg:text-sm">Année</label>
            <select
              id="year-select"
              v-model.number="selectedYear"
              class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-lvv-blue-600 focus:border-lvv-blue-600 py-1.5 pl-3 pr-8 lg:w-auto"
            >
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
            <label for="ref-year-select" class="text-xs text-gray-500 whitespace-nowrap lg:text-sm">Comparé à</label>
            <select
              id="ref-year-select"
              v-model.number="referenceYearOffset"
              class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-lvv-blue-600 focus:border-lvv-blue-600 py-1.5 pl-3 pr-8 lg:w-auto"
            >
              <option v-for="opt in referenceOffsetOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
            <span class="text-xs text-gray-500 whitespace-nowrap lg:text-sm">Affichage</span>
            <div class="inline-flex self-start rounded-md shadow-sm" role="group">
              <button
                type="button"
                :class="[
                  'px-2.5 py-1.5 text-sm font-medium rounded-l-md border border-gray-300 transition-colors',
                  displayMode === 'monthly'
                    ? 'bg-lvv-blue-600 text-white border-lvv-blue-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50',
                ]"
                @click="displayMode = 'monthly'"
              >
                Total
              </button>
              <button
                type="button"
                :class="[
                  'px-2.5 py-1.5 text-sm font-medium rounded-r-md border border-l-0 border-gray-300 transition-colors',
                  displayMode === 'daily'
                    ? 'bg-lvv-blue-600 text-white border-lvv-blue-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50',
                ]"
                @click="displayMode = 'daily'"
              >
                / jour
              </button>
            </div>
          </div>
          <div class="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
            <label for="sort-select" class="text-xs text-gray-500 whitespace-nowrap lg:text-sm">Trier par</label>
            <select
              id="sort-select"
              v-model="sortBy"
              class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-lvv-blue-600 focus:border-lvv-blue-600 py-1.5 pl-3 pr-8 lg:w-auto"
            >
              <option value="passages">Nb de passages</option>
              <option value="evolution">Évolution</option>
            </select>
          </div>
        </div>
        <p v-if="annualPartialHintText" class="text-xs text-gray-500 italic mb-3 text-right">
          {{ annualPartialHintText }}
        </p>
        <div v-if="counters.length === 0 && searchText" class="text-center py-12 text-gray-500">
          <Icon name="mdi:magnify" class="text-4xl text-gray-300 mb-3" />
          <p class="text-lg">Aucun compteur trouvé pour « {{ searchText }} »</p>
          <p class="mt-2 text-sm">{{ emptySearchHint }}</p>
        </div>
        <div v-else class="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <CounterCard
            v-for="counter of counters"
            :key="counter.name"
            :counter="counter"
            :comparison-period="comparisonPeriod"
            :selected-month="selectedMonth"
            :selected-year="selectedYear"
            :reference-year-offset="referenceYearOffset"
            :display-mode="displayMode"
            @highlight="highlightedCounter = $event"
          />
        </div>
      </div>
    </div>
    <LvvCta class="py-10" />
  </div>
</template>

<script setup lang="ts">
import MapPlaceholder from '~/components/MapPlaceholder.vue';

export type SortOption = 'passages' | 'evolution';
export type DisplayMode = 'monthly' | 'daily';
export type ComparisonPeriod = 'monthly' | 'annual';

const props = defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  counters: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filteredFeatures: any[];
  searchPlaceholder: string;
  emptySearchHint: string;
  availableMonths: string[];
  availableYears: number[];
}>();

const searchText = defineModel<string>('searchText', { required: true });
const showVoiesLyonnaises = defineModel<boolean>('showVoiesLyonnaises', { required: true });
const highlightedCounter = defineModel<string | null>('highlightedCounter', { required: true });
const sortBy = defineModel<SortOption>('sortBy', { required: true });
const selectedMonth = defineModel<string>('selectedMonth', { required: true });
const selectedYear = defineModel<number>('selectedYear', { required: true });
const referenceYearOffset = defineModel<number>('referenceYearOffset', { required: true });
const displayMode = defineModel<DisplayMode>('displayMode', { required: true });
const comparisonPeriod = defineModel<ComparisonPeriod>('comparisonPeriod', { required: true });
const showMap = defineModel<boolean>('showMap', { required: true });

function formatMonthOption(monthIso: string): string {
  const d = new Date(monthIso);
  const label = d.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const defaultMonth = computed(() => props.availableMonths[0] ?? '');
const defaultYear = computed(() => props.availableYears[0] ?? new Date().getFullYear());

function formatMonthName(monthIso: string): string {
  return new Date(monthIso).toLocaleString('fr-FR', { month: 'long' });
}

const annualPartialHintText = computed(() => {
  if (comparisonPeriod.value !== 'annual') {
    return '';
  }

  const months = props.availableMonths.filter((m) => m.startsWith(`${selectedYear.value}-`)).sort();
  if (months.length === 0 || months.length >= 12) {
    return '';
  }

  const first = formatMonthName(months[0]);
  if (months.length === 1) {
    return `Comparaison sur ${first} ${selectedYear.value}`;
  }

  const last = formatMonthName(months[months.length - 1]);
  return `Comparaison sur ${first}\u00a0–\u00a0${last}\u00a0${selectedYear.value}`;
});

const hasActiveFilters = computed(() => {
  return (
    !!searchText.value ||
    showVoiesLyonnaises.value ||
    sortBy.value !== 'passages' ||
    comparisonPeriod.value !== 'monthly' ||
    referenceYearOffset.value !== 1 ||
    displayMode.value !== 'monthly' ||
    !showMap.value ||
    (selectedMonth.value && selectedMonth.value !== defaultMonth.value) ||
    (selectedYear.value && selectedYear.value !== defaultYear.value)
  );
});

function resetFilters() {
  searchText.value = '';
  showVoiesLyonnaises.value = false;
  sortBy.value = 'passages';
  comparisonPeriod.value = 'monthly';
  referenceYearOffset.value = 1;
  displayMode.value = 'monthly';
  showMap.value = true;
  selectedMonth.value = defaultMonth.value;
  selectedYear.value = defaultYear.value;
}

const referenceOffsetOptions = computed(() => {
  const currentYear =
    comparisonPeriod.value === 'annual'
      ? selectedYear.value || (props.availableYears[0] ?? new Date().getFullYear())
      : new Date(selectedMonth.value || props.availableMonths[0] || `${new Date().getFullYear()}-01-01`).getFullYear();

  const oldest = props.availableYears[props.availableYears.length - 1] ?? currentYear - 5;
  const max = Math.max(1, currentYear - oldest);
  const options: { value: number; label: string }[] = [];

  for (let n = 1; n <= max; n++) {
    const refYear = currentYear - n;
    options.push({ value: n, label: `${n === 1 ? '1 an avant' : `${n} ans avant`} (${refYear})` });
  }

  return options;
});
</script>
