<template>
  <div class="bg-white not-prose w-52">
    <div class="py-1 bg-lvv-blue-600 flex flex-col items-center justify-center text-center text-white">
      <div class="font-bold text-base hover:underline">
        <a :href="feature.properties.link">{{ feature.properties.name }}</a>
      </div>
      <div>{{ title }}</div>
    </div>
    <div class="divide-y">
      <div class="py-1 flex items-center justify-around bg-zinc-100">
        <div class="text-base text-black w-8">
          <Icon v-if="canGoBack" name="mdi:chevron-left" class="cursor-pointer" @click="navigate(-1)" />
        </div>
        <div class="text-base text-black cursor-pointer select-none hover:underline" @click="toggleMode">
          {{ displayDate }}
        </div>
        <div class="text-base text-black w-8">
          <Icon v-if="canGoForward" name="mdi:chevron-right" class="cursor-pointer" @click="navigate(+1)" />
        </div>
      </div>

      <div v-if="isComparaison" class="py-1 flex items-center justify-center text-black">
        <div class="text-base font-bold">
          {{ displayValue('velo') }}
        </div>
        <div class="px-2 text-3xl flex items-center">
          <Icon name="game-icons:dutch-bike" />
        </div>
        <div class="text-left leading-3">
          <div class="font-bold">vélos/jour</div>
          <div>en moyenne</div>
        </div>
        <Icon
          v-if="getRecordType('velo') === 'absolute'"
          name="noto:1st-place-medal"
          class="text-base ml-1"
          title="Record absolu !"
        />
        <span
          v-else-if="getRecordType('velo') === 'relative'"
          class="ml-1 w-2.5 h-2.5 rounded-full bg-pink-400 inline-block"
          title="Record du mois"
        />
      </div>

      <div v-if="isComparaison" class="py-1 flex items-center justify-center text-black">
        <div class="text-base font-bold">
          {{ displayValue('voiture') }}
        </div>
        <div class="px-2 text-3xl flex items-center">
          <Icon name="fluent:vehicle-car-profile-ltr-16-regular" />
        </div>
        <div class="text-left leading-3">
          <div class="font-bold">voitures/jour</div>
          <div>en moyenne</div>
        </div>
        <Icon
          v-if="getRecordType('voiture') === 'absolute'"
          name="noto:1st-place-medal"
          class="text-base ml-1"
          title="Record absolu !"
        />
        <span
          v-else-if="getRecordType('voiture') === 'relative'"
          class="ml-1 w-2.5 h-2.5 rounded-full bg-pink-400 inline-block"
          title="Record du mois"
        />
      </div>

      <!-- Single counter row -->
      <div v-if="!isComparaison" class="py-1 flex items-center justify-center text-black">
        <div class="text-base font-bold">
          {{ displayValue('single') }}
        </div>
        <div class="px-2 text-3xl flex items-center">
          <Icon :name="icon" />
        </div>
        <div class="text-left leading-3">
          <div class="font-bold">par jour</div>
          <div>en moyenne</div>
        </div>
        <Icon
          v-if="getRecordType('single') === 'absolute'"
          name="noto:1st-place-medal"
          class="text-base ml-1"
          title="Record absolu !"
        />
        <span
          v-else-if="getRecordType('single') === 'relative'"
          class="ml-1 w-2.5 h-2.5 rounded-full bg-pink-400 inline-block"
          title="Record du mois"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CompteurFeature } from '~/types';

const { feature } = defineProps<{
  feature: CompteurFeature;
}>();

const counts = feature.properties.counts;

const title = computed(() =>
  feature.properties.type === 'compteur-comparaison'
    ? 'Compteur trafic'
    : feature.properties.type === 'compteur-velo'
      ? 'Compteur vélo'
      : 'Compteur voiture',
);

const isComparaison = computed(() => feature.properties.type === 'compteur-comparaison');

const icon = computed(() =>
  feature.properties.type === 'compteur-velo' ? 'game-icons:dutch-bike' : 'fluent:vehicle-car-profile-ltr-16-regular',
);

const mode = ref<'monthly' | 'annual'>('monthly');
const monthIndex = ref(counts.length - 1);

const years = computed(() => {
  const byYear = new Map<number, typeof counts>();
  for (const c of counts) {
    const y = new Date(c.month).getFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(c);
  }
  return Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, months]) => ({ year, months }));
});
const yearIndex = ref(years.value.length - 1);

function toggleMode() {
  if (mode.value === 'monthly') {
    mode.value = 'annual';
    const entry = counts[monthIndex.value];
    const currentYear = entry ? new Date(entry.month).getFullYear() : 0;
    yearIndex.value = years.value.findIndex((y) => y.year === currentYear);
    if (yearIndex.value < 0) yearIndex.value = years.value.length - 1;
  } else {
    mode.value = 'monthly';
  }
}

const canGoBack = computed(() => (mode.value === 'monthly' ? monthIndex.value > 0 : yearIndex.value > 0));
const canGoForward = computed(() =>
  mode.value === 'monthly' ? monthIndex.value < counts.length - 1 : yearIndex.value < years.value.length - 1,
);

function navigate(offset: number) {
  if (mode.value === 'monthly') {
    monthIndex.value = Math.max(0, Math.min(counts.length - 1, monthIndex.value + offset));
  } else {
    yearIndex.value = Math.max(0, Math.min(years.value.length - 1, yearIndex.value + offset));
  }
}

const displayDate = computed(() => {
  if (mode.value === 'monthly') {
    const entry = counts[monthIndex.value];
    return entry ? new Date(entry.month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' }) : '';
  }
  return `Année ${years.value[yearIndex.value]?.year ?? ''}`;
});

function roundTo25(value: number): number {
  return Math.round(value / 25) * 25;
}

const numberFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

type CountEntry = (typeof counts)[0];

function getCountValue(entry: CountEntry, field: 'count' | 'veloCount' | 'voitureCount'): number {
  if (field === 'count' && 'count' in entry) return entry.count;
  if (field === 'veloCount' && 'veloCount' in entry) return entry.veloCount;
  if (field === 'voitureCount' && 'voitureCount' in entry) return entry.voitureCount;
  return 0;
}

function getMonthlyDailyAvg(countEntry: CountEntry, field: 'count' | 'veloCount' | 'voitureCount'): number {
  const val = getCountValue(countEntry, field);
  const date = new Date(countEntry.month);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return val / daysInMonth;
}

function getAnnualDailyAvg(yearEntry: (typeof years.value)[0], field: 'count' | 'veloCount' | 'voitureCount'): number {
  let total = 0;
  let totalDays = 0;
  for (const c of yearEntry.months) {
    total += getCountValue(c, field);
    const date = new Date(c.month);
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    totalDays += daysInMonth;
  }
  return totalDays > 0 ? total / totalDays : 0;
}

function displayValue(kind: 'single' | 'velo' | 'voiture'): string {
  const field = kind === 'velo' ? 'veloCount' : kind === 'voiture' ? 'voitureCount' : 'count';
  let avg: number;
  if (mode.value === 'monthly') {
    const entry = counts[monthIndex.value];
    avg = entry ? getMonthlyDailyAvg(entry, field) : 0;
  } else {
    const year = years.value[yearIndex.value];
    avg = year ? getAnnualDailyAvg(year, field) : 0;
  }
  return numberFormatter.format(roundTo25(avg));
}

// voir https://github.com/lavilleavelo/cyclopolis/issues/321#issuecomment-2660976154 pour la définition des records
function getRecordType(kind: 'single' | 'velo' | 'voiture'): 'absolute' | 'relative' | null {
  const field = kind === 'velo' ? 'veloCount' : kind === 'voiture' ? 'voitureCount' : 'count';

  if (mode.value === 'annual') {
    const year = years.value[yearIndex.value];
    if (!year) return null;
    const currentAvg = getAnnualDailyAvg(year, field);
    const allAvgs = years.value.map((y) => getAnnualDailyAvg(y, field));
    if (currentAvg > 0 && currentAvg >= Math.max(...allAvgs)) {
      return 'absolute';
    }
    return null;
  }

  const currentEntry = counts[monthIndex.value];
  if (!currentEntry) {
    return null;
  }

  const currentAvg = getMonthlyDailyAvg(currentEntry, field);
  if (currentAvg === 0) {
    return null;
  }

  const allAvgs = counts.map((c) => getMonthlyDailyAvg(c, field));
  if (currentAvg >= Math.max(...allAvgs)) {
    return 'absolute';
  }

  const currentMonth = new Date(currentEntry.month).getMonth();
  const sameMonthAvgs = counts
    .filter((c) => new Date(c.month).getMonth() === currentMonth)
    .map((c) => getMonthlyDailyAvg(c, field));
  if (currentAvg >= Math.max(...sameMonthAvgs)) {
    return 'relative';
  }

  return null;
}
</script>
