<template>
  <ProseH3 id="position-des-capteurs">Position des capteurs</ProseH3>
  <p>{{ intro }}</p>

  <ClientOnly fallback-tag="div">
    <template #fallback>
      <MapPlaceholder additional-class="mt-6 h-[300px] rounded-lg sm:h-[360px]" />
    </template>
    <CounterPointsMap :points="mapPoints" class="mt-6" />
  </ClientOnly>

  <div class="not-prose mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
    <span v-for="item in legend" :key="item.label" class="inline-flex items-center gap-1.5">
      <span class="inline-block h-3 w-3 rounded-full" :style="{ backgroundColor: item.color }" />
      {{ item.label }}
    </span>
  </div>

  <CounterPhotosButton :id-pdc="veloIdPdc" />

  <div class="not-prose mt-6 overflow-x-auto">
    <table class="min-w-full text-sm">
      <caption class="pb-2 text-left text-xs uppercase tracking-wide text-gray-500">
        Fiabilité sur les douze derniers mois
      </caption>
      <tbody>
        <tr v-for="row in reliability" :key="row.label" class="border-b border-gray-100 align-top">
          <td class="py-2 pr-3">
            <span
              class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
              :style="{ backgroundColor: row.color }"
            >
              {{ row.label }}
            </span>
          </td>
          <td class="py-2 pr-3 min-w-[10rem]">
            <div class="font-medium text-gray-900">{{ row.title }}</div>
            <div class="text-xs text-gray-500">{{ row.detail }}</div>
            <div v-if="row.lastDay" class="text-xs text-gray-500">
              Dernières données le {{ formatDay(row.lastDay) }}
            </div>
            <div v-for="gap in row.gaps" :key="gap" class="text-xs text-lvv-pink">{{ gap }}</div>
          </td>
          <td class="py-2 text-right whitespace-nowrap">
            <div class="font-semibold" :class="row.low ? 'text-lvv-pink' : 'text-gray-900'">{{ row.value }}</div>
            <div class="text-xs text-gray-500">{{ row.metric }}</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="text-sm">
    Quand un capteur voiture est en panne, le Cerema complète les données avec un modèle prédictif. Le pourcentage
    indique la part du trafic réellement mesurée.
  </p>
</template>

<script setup lang="ts">
import {
  VELO_COLOR,
  VOITURE_COLOR,
  formatDay,
  formatPercent,
  useCounterDetailedStats,
  type DayRange,
} from '~/composables/useCounterDetailedStats';
import {
  countPointDirection,
  countPointLanes,
  countPointSection,
  distanceInMeters,
  formatDistance,
  toLngLat,
  type CountPoint,
  type MapPoint,
} from '~/composables/useCountPoints';

const PERIOD_DAYS = 365;
const MIN_GAP_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const OUTAGE_SHARE = 0.2;
const LOW_RELIABILITY = 0.5;

const props = defineProps<{
  veloIdPdc: number;
  veloName: string;
  veloCoordinates: number[];
  voitureIdsPdc: number[];
  voiturePoints: CountPoint[];
}>();

const { data: veloStats } = useCounterDetailedStats({ type: 'velo', idPdc: props.veloIdPdc });
const { data: voitureStats } = useCounterDetailedStats({ type: 'voiture', idsPdc: props.voitureIdsPdc });

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[middle] ?? 0) : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function percent(share: number | null): string {
  return formatPercent(share === null ? null : share * 100);
}

function toDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

const yesterday = toDay(Date.now() - DAY_MS);

function gapLabels(gaps: DayRange[] | undefined): string[] {
  return (gaps ?? [])
    .filter((gap) => gap.to < yesterday)
    .map((gap) => {
      const sameYear = gap.from.slice(0, 4) === gap.to.slice(0, 4);
      const from = sameYear ? formatDay(gap.from, { day: 'numeric', month: 'long' }) : formatDay(gap.from);
      return `Sans données du ${from} au ${formatDay(gap.to)}`;
    });
}

const windowEnd = Date.parse(`${yesterday}T00:00:00Z`);
const windowDays = Array.from({ length: PERIOD_DAYS }, (_, index) =>
  toDay(windowEnd - (PERIOD_DAYS - 1 - index) * DAY_MS),
);

const veloDaysWithData = computed(() => {
  const daily = veloStats.value?.daily;
  if (!daily) {
    return null;
  }

  const start = Date.parse(`${daily.start}T00:00:00Z`);
  const counts = daily.values.filter((value): value is number => value !== null && value > 0);
  const threshold = OUTAGE_SHARE * median(counts);
  return new Set(
    daily.values.flatMap((value, index) =>
      value !== null && value > 0 && value >= threshold ? [toDay(start + index * DAY_MS)] : [],
    ),
  );
});

const veloGaps = computed<DayRange[]>(() => {
  const withData = veloDaysWithData.value;
  if (!withData) {
    return [];
  }

  const gaps: DayRange[] = [];
  let gapStart: string | null = null;
  let previous: string | null = null;
  for (const day of [...windowDays, null]) {
    if (day !== null && !withData.has(day)) {
      gapStart ??= day;
    } else {
      if (gapStart !== null && previous !== null) {
        const length = (Date.parse(`${previous}T00:00:00Z`) - Date.parse(`${gapStart}T00:00:00Z`)) / DAY_MS + 1;
        if (length >= MIN_GAP_DAYS) {
          gaps.push({ from: gapStart, to: previous });
        }
      }
      gapStart = null;
    }
    previous = day;
  }
  return gaps;
});

const veloAvailability = computed(() => {
  const withData = veloDaysWithData.value;
  return withData ? windowDays.filter((day) => withData.has(day)).length / PERIOD_DAYS : null;
});

const legend = [
  { label: 'Compteur vélo', color: VELO_COLOR },
  { label: 'Capteur voiture', color: VOITURE_COLOR },
];

const nearest = computed(() =>
  Math.min(...props.voiturePoints.map((point) => distanceInMeters(props.veloCoordinates, point.coordinates))),
);

const intro = computed(() => {
  const distance = formatDistance(nearest.value);
  const cars =
    props.voiturePoints.length === 1
      ? `un capteur du Cerema, à ${distance} du compteur vélo`
      : `${props.voiturePoints.length} capteurs du Cerema, le plus proche à ${distance} du compteur vélo`;
  return `Le compteur vélo compte les passages dans les deux sens. Le trafic voiture est mesuré par ${cars}.`;
});

const reliability = computed(() => [
  {
    label: 'V',
    color: VELO_COLOR,
    title: 'Compteur vélo',
    detail: props.veloName,
    value: percent(veloAvailability.value),
    metric: 'des jours sans panne',
    low: veloAvailability.value !== null && veloAvailability.value < LOW_RELIABILITY,
    lastDay: veloStats.value?.lastDay ?? null,
    gaps: gapLabels(veloGaps.value),
  },
  ...props.voiturePoints.map((point, index) => {
    const pointStats = voitureStats.value?.points?.find((candidate) => candidate.id === point.idPdc);
    const measured = pointStats?.measuredShare ?? null;
    return {
      label: String(index + 1),
      color: VOITURE_COLOR,
      title: countPointSection(point.name),
      detail: [countPointDirection(point), countPointLanes(point)].filter(Boolean).join(' · '),
      value: percent(measured),
      metric: 'du trafic mesuré',
      low: measured !== null && measured < LOW_RELIABILITY,
      lastDay: pointStats?.lastDay ?? null,
      gaps: gapLabels(pointStats?.gaps),
    };
  }),
]);

const mapPoints = computed<MapPoint[]>(() => [
  {
    label: 'V',
    title: 'Compteur vélo',
    detail: props.veloName,
    coordinates: toLngLat(props.veloCoordinates),
    color: VELO_COLOR,
  },
  ...props.voiturePoints.map((point, index) => ({
    label: String(index + 1),
    title: countPointSection(point.name),
    detail: [countPointDirection(point), countPointLanes(point)].filter(Boolean).join(' · '),
    coordinates: toLngLat(point.coordinates),
    color: VOITURE_COLOR,
  })),
]);
</script>
