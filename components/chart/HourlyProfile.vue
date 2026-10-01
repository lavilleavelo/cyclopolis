<template>
  <ClientOnly>
    <highcharts :options="chartOptions" />
  </ClientOnly>
</template>

<script setup lang="ts">
import {
  SCHOOL_HOLIDAY_COLOR,
  WEEKDAY_COLOR,
  WEEKEND_COLOR,
  capitalize,
  formatCount,
  type CounterProfile,
} from '~/composables/useCounterDetailedStats';

const props = defineProps<{ title: string; subtitle?: string; stats: CounterProfile; unit?: string }>();

type TooltipContext = {
  points?: { y: number; point: { index: number }; series: { name: string; color: string } }[];
};

const chartOptions = computed(() => {
  const { weekday, schoolHoliday, weekend } = props.stats.hourlyProfile;
  const { morning, evening } = props.stats.peakHours;
  const peakHours = [morning?.hour, evening?.hour];

  return {
    chart: { type: 'line', height: 340 },
    lang: { locale: 'fr-FR' },
    title: { text: props.title },
    subtitle: { text: props.subtitle },
    credits: { enabled: false },
    xAxis: {
      categories: weekday.map((_, hour) => `${hour}h`),
      tickInterval: 2,
      crosshair: true,
    },
    yAxis: { min: 0, title: { text: `${capitalize(props.unit ?? 'passages')} / heure (moyenne)` } },
    tooltip: {
      shared: true,
      formatter(this: TooltipContext) {
        const points = this.points ?? [];
        const hour = points[0]?.point.index ?? 0;
        const rows = points.map(
          (p) => `<span style="color:${p.series.color}">●</span> ${p.series.name} : <b>${formatCount(p.y)}</b>`,
        );
        return [`<b>${hour}h – ${hour + 1}h</b>`, ...rows].join('<br/>');
      },
    },
    plotOptions: {
      line: { lineWidth: 2, marker: { enabled: false, symbol: 'circle' } },
    },
    series: [
      {
        name: 'Jours ouvrés (période scolaire)',
        color: WEEKDAY_COLOR,
        data: weekday.map((y, hour) => {
          if (y !== null && peakHours.includes(hour)) {
            return {
              y,
              marker: { enabled: true, radius: 4 },
              dataLabels: { enabled: true, format: formatCount(y), style: { color: '#374151' } },
            };
          }

          return y;
        }),
      },
      { name: 'Jours ouvrés (vacances scolaires)', color: SCHOOL_HOLIDAY_COLOR, data: schoolHoliday },
      { name: 'Weekend et jours fériés', color: WEEKEND_COLOR, data: weekend },
    ],
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
