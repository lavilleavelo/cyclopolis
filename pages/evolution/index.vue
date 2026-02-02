<template>
  <div class="h-full w-full flex flex-col">
    <ClientOnly fallback-tag="div">
      <template #fallback>
        <MapPlaceholder />
      </template>

      <Map
        :features="filteredFeatures"
        :options="{
          logo: true,
          legend: false,
          showLineFilters: true,
          canUseSidePanel: true,
          updateUrlOnFeatureClick: true,
          filterStyle: 'height: calc(100vh - 240px)',
        }"
        class="flex-1"
        :total-distance="totalDistance"
        :filtered-distance="filteredDistance"
        :filters="filters"
        :actions="actions"
      />
    </ClientOnly>
    <div>
      <div class="py-2 px-5 md:px-8 text-white bg-lvv-blue-600 font-semibold text-base">
        {{ doneDistance }} km de {{ getRevName() }} réalisés
      </div>
      <div class="py-5 px-5 md:px-8 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 sm:gap-4">
        <div v-for="year in years" :key="year.label" @click="toggleYear(year.label)">
          <div
            class="border rounded-md py-3 px-3 flex items-center justify-center text-sm font-medium uppercase sm:flex-1 cursor-pointer focus:outline-none"
            :class="{
              'bg-lvv-blue-600 border-transparent text-white hover:bg-lvv-blue-500': year.isChecked,
              'bg-white border-gray-200 text-gray-900 hover:bg-gray-50': !year.isChecked,
            }"
          >
            <div class="text-center">
              <div class="whitespace-nowrap font-bold">{{ year.label }}</div>
              <div class="text-xs" :class="{ 'text-gray-500': !year.isChecked }">
                {{ year.distance }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MapPlaceholder from '~/components/MapPlaceholder.vue';
import { useBikeLaneFilters } from '~/composables/useBikeLaneFilters';
import { useVoiesCyclablesGeojson } from '~/composables/useVoiesCyclables';

const { getAllUniqLineStrings, getDistance } = useStats();
const { getRevName } = useConfig();

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen',
});

const { geojsons } = await useVoiesCyclablesGeojson();

const { voies } = await useGetVoiesCyclablesNums();

const startYear = 2021;
const currentYear = new Date().getFullYear();
const yearConfigs = [
  { label: `< ${startYear}`, param: `before${startYear}`, match: (year: number) => year < startYear },
  ...Array.from({ length: currentYear - startYear + 1 }, (_, index) => {
    const year = startYear + index;
    return { label: `${year}`, param: `${year}`, match: (value: number) => value === year };
  }),
];

const route = useRoute();
const router = useRouter();

const selectedYearParams = ref<string[]>([`before${startYear}`]);

onMounted(() => {
  const yearsParam = typeof route.query.years === 'string' ? route.query.years : `before${startYear}`;
  selectedYearParams.value = yearsParam ? yearsParam.split(',').filter(Boolean) : [`before${startYear}`];
});

watch(
  () => route.query.years,
  (newYears) => {
    const yearsParam = newYears ? newYears.toString() : `before${startYear}`;
    selectedYearParams.value = yearsParam ? yearsParam.split(',').filter(Boolean) : [`before${startYear}`];
  },
);

const years = computed(() => {
  return yearConfigs.map((config, index) => ({
    ...config,
    isChecked: selectedYearParams.value.includes(config.param),
    distance: `${index === 0 ? '' : '+'}${computeDistance(filterFeatures(geojsons.value, [config]))}km`,
  }));
});

function toggleYear(label: string) {
  const config = yearConfigs.find((c) => c.label === label);
  if (!config) return;

  const selected = selectedYearParams.value;
  const newSelection = selected.includes(config.param)
    ? selected.filter((y) => y !== config.param)
    : [...selected, config.param];

  router.push({
    query: {
      ...route.query,
      years: newSelection.length > 0 ? newSelection.join(',') : '',
    },
  });
}

const features = computed(() =>
  filterFeatures(
    geojsons.value,
    yearConfigs.filter((config) => selectedYearParams.value.includes(config.param)),
  ),
);

const doneDistance = computed(() => computeDistance(features.value));

function filterFeatures(jsons: typeof geojsons.value, selectedYears: typeof yearConfigs) {
  if (!jsons) return [];
  return jsons
    .flatMap((json) => json.features)
    .filter((feature) => 'status' in feature.properties && feature.properties.status === 'done')
    .filter((feature) => {
      if (!('status' in feature.properties) || !feature.properties.doneAt) {
        return false;
      }
      const [, , featureYear] = feature.properties.doneAt.split('/');
      return selectedYears.some((year) => year.match(Number(featureYear)));
    });
}

function computeDistance(selectedFeatures: typeof features.value) {
  if (!geojsons.value || !geojsons.value.length) return 0;
  const allUniqFeatures = getAllUniqLineStrings([{ ...geojsons.value[0], features: selectedFeatures }]);
  const doneDistance = getDistance({ features: allUniqFeatures });
  return Math.round(doneDistance / 100) / 10;
}

const { filters, actions, filteredFeatures, totalDistance, filteredDistance } = useBikeLaneFilters({
  allFeatures: features,
  allLines: computed(() => voies.value),
});
</script>
