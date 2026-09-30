<template>
  <p v-if="veloStatus === 'error' || voitureStatus === 'error'" class="mt-8 text-sm italic">
    Les statistiques détaillées de ces compteurs sont momentanément indisponibles.
  </p>

  <div v-else>
    <ProseH2 id="semaine-weekend-et-vacances">Semaine, weekend et vacances</ProseH2>
    <p>Part des vélos dans le trafic (vélos et voitures) selon le type de jour et l'heure.</p>

    <div class="flex items-center gap-2 mt-6">
      <label for="comparison-period" class="text-xs text-gray-500 whitespace-nowrap lg:text-sm">Période</label>
      <select
        id="comparison-period"
        v-model="period"
        class="text-xs border border-gray-300 rounded-md shadow-sm focus:ring-lvv-blue-600 focus:border-lvv-blue-600 py-1 pl-2 pr-6"
      >
        <option value="recent">12 derniers mois</option>
        <option v-for="year in years" :key="year" :value="year">
          {{ year }}{{ year === currentYear ? ' (en cours)' : '' }}
        </option>
      </select>
    </div>

    <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <template v-if="veloProfile && voitureProfile">
        <div v-for="tile in shareTiles" :key="tile.label" class="bg-white rounded-lg shadow-sm p-4 text-center">
          <div class="text-xs text-gray-500 uppercase tracking-wide">{{ tile.label }}</div>
          <div class="text-2xl font-bold text-lvv-pink mt-1">{{ tile.value }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ tile.detail }}</div>
        </div>
      </template>
      <template v-else>
        <div v-for="i in 4" :key="i" class="h-[104px] bg-gray-100 rounded-lg animate-pulse" />
      </template>
    </div>

    <ChartComparisonHourlyProfile
      v-if="veloProfile && voitureProfile"
      :title="`Vélos et voitures par heure - ${name}`"
      :subtitle="periodLabel"
      :velo="veloProfile"
      :voiture="voitureProfile"
      class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
    />
    <div v-else class="mt-8 h-[340px] bg-gray-100 rounded-lg animate-pulse" />

    <ProseH2 id="evolution-de-la-part-du-velo">Évolution de la part du vélo</ProseH2>
    <p>Part des vélos dans le trafic, année par année, aux heures de pointe et sur la journée.</p>
    <ChartComparisonPeakEvolution
      v-if="velo && veloYearly && voitureYearly && currentYear"
      :title="`Part du vélo aux heures de pointe - ${name}`"
      :velo="veloYearly"
      :voiture="voitureYearly"
      :morning-hour="velo.peakHours.morning?.hour ?? DEFAULT_PEAK_HOURS[0]"
      :evening-hour="velo.peakHours.evening?.hour ?? DEFAULT_PEAK_HOURS[1]"
      :current-year="currentYear"
      class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
    />
    <div v-else class="mt-8 h-[340px] bg-gray-100 rounded-lg animate-pulse" />

    <ProseH2 id="evolution-journaliere">Évolution journalière</ProseH2>
    <p>Moyenne sur 7 jours des vélos et des voitures.</p>
    <ChartComparisonDailyEvolution
      v-if="velo && voiture"
      :title="`Fréquentation journalière vélo et voiture - ${name}`"
      :velo="velo"
      :voiture="voiture"
      :selected-day="day"
      class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
      @select-day="day = $event"
    />
    <div v-else class="mt-8 h-[380px] bg-gray-100 rounded-lg animate-pulse" />

    <ProseH3 id="heure-par-heure">Heure par heure</ProseH3>
    <p>Cliquez sur une journée du graphique ou choisissez une date pour la voir heure par heure.</p>
    <ChartComparisonHourlyDay
      v-if="velo && voiture"
      v-model:day="day"
      :title="`Vélos et voitures heure par heure - ${name}`"
      :velo-counter="veloCounter"
      :voiture-counter="voitureCounter"
      :min="firstCommonDay"
      :max="lastCommonDay"
      class="mt-4 lg:p-4 lg:rounded-lg lg:shadow-md"
    />
  </div>
</template>

<script setup lang="ts">
import {
  formatCount,
  formatDay,
  useCounterDetailedStats,
  useCounterYearlyStats,
  type CounterRef,
  type DayType,
} from '~/composables/useCounterDetailedStats';

const PEAK_SHARE_HOURS = [6, 22];
const DEFAULT_PEAK_HOURS = [8, 18];

const props = defineProps<{ veloIdPdc: number; voitureIdsPdc: number[]; name: string }>();

const veloCounter: CounterRef = { type: 'velo', idPdc: props.veloIdPdc };
const voitureCounter: CounterRef = { type: 'voiture', idsPdc: props.voitureIdsPdc };

const { data: velo, status: veloStatus } = useCounterDetailedStats(veloCounter);
const { data: voiture, status: voitureStatus } = useCounterDetailedStats(voitureCounter);
const { data: veloYearly } = useCounterYearlyStats(veloCounter);
const { data: voitureYearly } = useCounterYearlyStats(voitureCounter);

const firstCommonDay = computed(() => [velo.value?.firstDay ?? '', voiture.value?.firstDay ?? ''].sort().at(-1)!);
const lastCommonDay = computed(() => [velo.value?.lastDay ?? '', voiture.value?.lastDay ?? ''].sort()[0]);

const day = ref<string | null>(null);
const period = ref<'recent' | number>('recent');

const currentYear = computed(() => (lastCommonDay.value ? Number(lastCommonDay.value.slice(0, 4)) : null));

const years = computed(() =>
  (veloYearly.value ?? [])
    .filter(
      (velo) =>
        velo.averages.weekday !== null &&
        voitureYearly.value?.some((voiture) => voiture.year === velo.year && voiture.averages.weekday !== null),
    )
    .map((velo) => velo.year)
    .sort((a, b) => b - a),
);

const veloProfile = computed(() =>
  period.value === 'recent' ? velo.value : veloYearly.value?.find((year) => year.year === period.value),
);
const voitureProfile = computed(() =>
  period.value === 'recent' ? voiture.value : voitureYearly.value?.find((year) => year.year === period.value),
);

const periodLabel = computed(() => {
  if (period.value !== 'recent') {
    return `Année ${period.value}${period.value === currentYear.value ? ' (en cours)' : ''}`;
  }

  return velo.value ? `Du ${formatDay(velo.value.period.from)} au ${formatDay(velo.value.period.to)}` : '';
});

function share(bikes: number | null, cars: number | null): number | null {
  if (bikes === null || cars === null || bikes + cars === 0) {
    return null;
  }

  return bikes / (bikes + cars);
}

function formatShare(value: number | null): string {
  return value === null ? '–' : `${Math.round(value * 100)} %`;
}

const shareTiles = computed(() => {
  const veloStats = veloProfile.value;
  const voitureStats = voitureProfile.value;
  if (!veloStats || !voitureStats) {
    return [];
  }

  const dayTypes: { type: DayType; label: string }[] = [
    { type: 'weekday', label: 'Jour ouvré' },
    { type: 'schoolHoliday', label: 'Vacances scolaires' },
    { type: 'weekend', label: 'Weekend et fériés' },
  ];
  const tiles = dayTypes.map(({ type, label }) => {
    const bikes = veloStats.averages[type];
    const cars = voitureStats.averages[type];
    return {
      label,
      value: formatShare(share(bikes, cars)),
      detail: `${formatCount(bikes ?? 0)} vélos · ${formatCount(cars ?? 0)} voitures`,
    };
  });

  const hourlyShares = veloStats.hourlyProfile.weekday.map((bikes, hour) =>
    share(bikes, voitureStats.hourlyProfile.weekday[hour] ?? null),
  );
  let peakHour = PEAK_SHARE_HOURS[0];
  for (let hour = PEAK_SHARE_HOURS[0]; hour < PEAK_SHARE_HOURS[1]; hour++) {
    if ((hourlyShares[hour] ?? 0) > (hourlyShares[peakHour] ?? 0)) {
      peakHour = hour;
    }
  }
  tiles.push({
    label: 'Pic vélo',
    value: `${peakHour}h`,
    detail: `${formatShare(hourlyShares[peakHour])} du trafic, jours ouvrés`,
  });

  return tiles;
});
</script>
