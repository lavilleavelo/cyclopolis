<template>
  <div class="h-full w-full flex flex-col">
    <ClientOnly>
      <Map :features="features" :options="{ logo: false }" class="flex-1" />
    </ClientOnly>
    <div>
      <div class="py-2 px-5 md:px-8 text-white bg-lvv-blue-600 font-semibold text-base">
        {{ doneDistance }} km de {{ getRevName() }} réalisés
      </div>
      <div class="py-5 px-5 md:px-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
        <div v-for="year in years" :key="year.label" @click="year.isChecked = !year.isChecked">
          <div
            class="border rounded-md py-3 px-3 flex items-center justify-center text-sm font-medium uppercase sm:flex-1 cursor-pointer focus:outline-none"
            :class="{
              'bg-lvv-blue-600 border-transparent text-white hover:bg-lvv-blue-500': year.isChecked,
              'bg-white border-gray-200 text-gray-900 hover:bg-gray-50': !year.isChecked
            }">
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
const { getAllUniqLineStrings, getDistance } = useStats();
const { getRevName } = useConfig();

// https://github.com/nuxt/framework/issues/3587
definePageMeta({
  pageTransition: false,
  layout: 'fullscreen'
});

const { data: geojsons } = await useAsyncData(() => {
  return queryCollection('voiesCyclablesGeojson').all();
});

const years = ref([
  { label: '< 2021', match: (year: number) => year < 2021, isChecked: true, distance: '' },
  { label: '2021', match: (year: number) => year === 2021, isChecked: false },
  { label: '2022', match: (year: number) => year === 2022, isChecked: false },
  { label: '2023', match: (year: number) => year === 2023, isChecked: false },
  { label: '2024', match: (year: number) => year === 2024, isChecked: false },
  { label: '2025', match: (year: number) => year === 2025, isChecked: false }
]);

years.value.forEach((year, index) =>
  year.distance = `${index === 0 ? '' : '+'}${computeDistance(filterFeatures(geojsons.value, [year]))}km`
);

const features = computed(() => {
  return filterFeatures(geojsons.value, years.value.filter(year => year.isChecked));
});

const doneDistance = computed(() => computeDistance(features.value));

function filterFeatures(jsons: typeof geojsons.value, selectedYears: typeof years.value) {
  if (!jsons) return [];
  return jsons
    .flatMap(json => json.features)
    .filter(feature => 'status' in feature.properties && feature.properties.status === 'done')
    .filter(feature => {
      if (!('status' in feature.properties) || !feature.properties.doneAt) { return false; }
      const [, , featureYear] = feature.properties.doneAt.split('/');
      return selectedYears.some(year => year.match(Number(featureYear)));
    });
}

function computeDistance(selectedFeatures: typeof features.value) {
  if (!geojsons.value) return 0;
  const allUniqFeatures = getAllUniqLineStrings([{ ...geojsons.value[0], features: selectedFeatures }]);
  const doneDistance = getDistance({ features: allUniqFeatures });
  return Math.round(doneDistance / 100) / 10;
}
</script>
