<template>
  <div>
    <ClientOnly>
      <highcharts :options="chartOptions" />
    </ClientOnly>
    <p v-if="hasReconstructedYears" class="text-xs text-gray-500 mt-2 mb-0">
      En pointillés : années où plus de la moitié du trafic voiture est estimée par le Cerema, faute de mesures du
      capteur.
    </p>
  </div>
</template>

<script setup lang="ts">
import { VELO_COLOR, formatCount, formatPercent, type YearlyStats } from '~/composables/useCounterDetailedStats';

const MORNING_COLOR = '#0891B2';
const EVENING_COLOR = '#9333EA';
const MIN_MEASURED_SHARE = 0.5;

const props = defineProps<{
  title: string;
  velo: YearlyStats[];
  voiture: YearlyStats[];
  morningHour: number;
  eveningHour: number;
  currentYear: number;
}>();

type TooltipContext = { points?: { point: { index: number } }[] };

function share(bikes: number | null | undefined, cars: number | null | undefined): number | null {
  if (bikes === null || bikes === undefined || cars === null || cars === undefined || bikes + cars === 0) {
    return null;
  }

  return Math.round((bikes / (bikes + cars)) * 1000) / 10;
}

const years = computed(() =>
  props.velo
    .map((velo) => ({ velo, voiture: props.voiture.find((voiture) => voiture.year === velo.year) }))
    .filter(
      (year): year is { velo: YearlyStats; voiture: YearlyStats } =>
        !!year.voiture && year.velo.averages.weekday !== null && year.voiture.averages.weekday !== null,
    ),
);

const reconstructedIndexes = computed(() =>
  years.value.flatMap(({ voiture }, index) => ((voiture.measuredShare ?? 1) < MIN_MEASURED_SHARE ? [index] : [])),
);

const hasReconstructedYears = computed(() => reconstructedIndexes.value.length > 0);

const chartOptions = computed(() => {
  const series = [
    {
      name: `À ${props.morningHour}h`,
      color: MORNING_COLOR,
      data: years.value.map(({ velo, voiture }) =>
        share(velo.hourlyProfile.weekday[props.morningHour], voiture.hourlyProfile.weekday[props.morningHour]),
      ),
    },
    {
      name: `À ${props.eveningHour}h`,
      color: EVENING_COLOR,
      data: years.value.map(({ velo, voiture }) =>
        share(velo.hourlyProfile.weekday[props.eveningHour], voiture.hourlyProfile.weekday[props.eveningHour]),
      ),
    },
    {
      name: 'Sur la journée',
      color: VELO_COLOR,
      data: years.value.map(({ velo, voiture }) => share(velo.averages.weekday, voiture.averages.weekday)),
    },
  ];
  const zones = reconstructedIndexes.value.flatMap((index) => [
    { value: index - 0.5 },
    { value: index + 0.5, dashStyle: 'ShortDot' },
  ]);

  return {
    chart: { type: 'line', height: 340 },
    lang: { locale: 'fr-FR' },
    title: { text: props.title },
    subtitle: { text: 'Jours ouvrés hors vacances scolaires' },
    credits: { enabled: false },
    xAxis: {
      categories: years.value.map(({ velo }) =>
        velo.year === props.currentYear ? `${velo.year}*` : String(velo.year),
      ),
      crosshair: true,
    },
    yAxis: { min: 0, title: { text: 'Part du vélo' }, labels: { format: '{value} %' } },
    tooltip: {
      shared: true,
      formatter(this: TooltipContext) {
        const index = this.points?.[0]?.point.index ?? 0;
        const { velo, voiture } = years.value[index];
        const lines = [
          `<b>${velo.year}${velo.year === props.currentYear ? ' (en cours)' : ''}</b>`,
          ...series.map(
            (serie) =>
              `<span style="color:${serie.color}">●</span> ${serie.name} : <b>${formatPercent(serie.data[index])}</b>`,
          ),
          `${formatCount(velo.averages.weekday ?? 0)} vélos · ${formatCount(voiture.averages.weekday ?? 0)} voitures par jour`,
        ];
        const estimatedShare = Math.round((1 - (voiture.measuredShare ?? 1)) * 100);
        if (estimatedShare > 0) {
          lines.push(
            `<span style="font-size: 10px; color: #6B7280">Part du trafic voiture estimée par le Cerema : ${estimatedShare} %</span>`,
          );
        }
        return lines.join('<br/>');
      },
    },
    plotOptions: {
      line: { lineWidth: 2, marker: { enabled: true, radius: 3, symbol: 'circle' }, zoneAxis: 'x', zones },
    },
    series,
    responsive: {
      rules: [
        {
          condition: { maxWidth: 500 },
          chartOptions: { yAxis: { title: { text: undefined } } },
        },
      ],
    },
  };
});
</script>
