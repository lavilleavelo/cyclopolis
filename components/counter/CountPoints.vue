<template>
  <ProseH3 id="points-de-comptage">Points de comptage</ProseH3>
  <p>{{ intro }}</p>

  <ClientOnly fallback-tag="div">
    <template #fallback>
      <MapPlaceholder additional-class="mt-6 h-[300px] rounded-lg sm:h-[360px]" />
    </template>
    <CounterPointsMap :points="mapPoints" class="mt-6" />
  </ClientOnly>

  <div class="not-prose mt-6 overflow-x-auto">
    <table class="min-w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
          <th class="py-2 pr-3 font-medium">Point</th>
          <th class="py-2 pr-3 font-medium">Tronçon</th>
          <th class="py-2 pr-3 font-medium text-right">Véhicules / jour</th>
          <th v-if="rows.length > 1" class="py-2 pr-3 font-medium text-right">Part du trafic</th>
          <th class="py-2 font-medium text-right">Données mesurées</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.idPdc" class="border-b border-gray-100 align-top">
          <td class="py-2 pr-3">
            <span
              class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-lvv-blue-600 text-xs font-bold text-white"
            >
              {{ row.label }}
            </span>
          </td>
          <td class="py-2 pr-3 min-w-[10rem]">
            <div class="font-medium text-gray-900">{{ row.section }}</div>
            <div class="text-xs text-gray-500">{{ row.details }}</div>
          </td>
          <td class="py-2 pr-3 text-right whitespace-nowrap">{{ row.average }}</td>
          <td v-if="rows.length > 1" class="py-2 pr-3 text-right whitespace-nowrap">{{ row.share }}</td>
          <td class="py-2 text-right whitespace-nowrap" :class="{ 'font-semibold text-lvv-pink': row.mostlyModelled }">
            {{ row.measured }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <p class="text-sm">
    Moyennes sur les douze derniers mois<template v-if="stats">
      (du {{ formatDay(stats.period.from) }} au {{ formatDay(stats.period.to) }})</template
    >. Quand un capteur est en panne, le Cerema complète les données avec un modèle prédictif. La dernière colonne
    indique la part du trafic réellement mesurée.
  </p>
</template>

<script setup lang="ts">
import { formatCount, formatDay, formatPercent, useCounterDetailedStats } from '~/composables/useCounterDetailedStats';
import {
  countPointDirection,
  countPointLanes,
  countPointSection,
  toLngLat,
  type CountPoint,
  type MapPoint,
} from '~/composables/useCountPoints';

const MOSTLY_MODELLED_SHARE = 0.5;

const props = defineProps<{ points: CountPoint[]; idsPdc: number[] }>();

const { data: stats } = useCounterDetailedStats({ type: 'voiture', idsPdc: props.idsPdc });

function percent(share: number | null | undefined): string {
  return formatPercent(share === null || share === undefined ? null : share * 100);
}

const intro = computed(() => {
  if (props.points.length === 1) {
    return "Ce compteur correspond à un point de comptage du Cerema, dont voici l'emplacement exact.";
  }

  const directions = new Set(props.points.map((point) => point.direction));
  const perDirection = directions.size === props.points.length ? ', un par sens de circulation' : '';
  return `Ce compteur additionne ${props.points.length} points de comptage du Cerema${perDirection}. Voici leur emplacement exact.`;
});

const rows = computed(() =>
  props.points.map((point, index) => {
    const pointStats = stats.value?.points?.find((candidate) => candidate.id === point.idPdc);
    return {
      idPdc: point.idPdc,
      label: String(index + 1),
      section: countPointSection(point.name),
      direction: countPointDirection(point),
      lanes: countPointLanes(point),
      details: [countPointDirection(point), countPointLanes(point), point.road, `point n°\u00A0${point.idPdc}`]
        .filter(Boolean)
        .join(' · '),
      average:
        pointStats?.average === null || pointStats?.average === undefined ? '–' : formatCount(pointStats.average),
      share: percent(pointStats?.share),
      measured: percent(pointStats?.measuredShare),
      mostlyModelled: (pointStats?.measuredShare ?? 1) < MOSTLY_MODELLED_SHARE,
      coordinates: toLngLat(point.coordinates),
    };
  }),
);

const mapPoints = computed<MapPoint[]>(() =>
  rows.value.map((row) => ({
    label: row.label,
    title: row.section,
    detail: [row.direction, row.lanes].filter(Boolean).join(' · '),
    coordinates: row.coordinates,
  })),
);
</script>
