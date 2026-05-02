<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <button type="button" class="flex items-start gap-2 text-left flex-1 min-w-0" @click="expanded = !expanded">
        <Icon
          :name="expanded ? 'mdi:chevron-down' : 'mdi:chevron-right'"
          class="text-xl text-gray-500 flex-shrink-0 mt-0.5"
        />
        <div class="min-w-0">
          <h3 class="text-lg font-semibold text-gray-900">Évolution comparée vélo / voiture depuis 2019</h3>
          <div class="space-y-1 text-sm">
            <p>
              <span class="font-semibold text-lvv-pink">Vélo&nbsp;:</span>
              {{ veloSummary }}
            </p>
            <p>
              <span class="font-semibold text-lvv-blue-600">Voiture&nbsp;:</span>
              {{ voitureSummary }}
            </p>
          </div>
        </div>
      </button>
      <div v-if="expanded" class="flex flex-wrap items-center justify-end gap-2 w-full lg:w-auto">
        <button
          type="button"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          @click.stop="dialogOpen = true"
        >
          <Icon name="mdi:information-outline" class="text-base" />
          Méthodologie
        </button>
      </div>
    </div>

    <div v-if="expanded" class="mt-4 space-y-6">
      <ClientOnly>
        <highcharts :options="chartOptions" />
      </ClientOnly>

      <ChartMethodologyDialog
        :open="dialogOpen"
        kind-label="vélo et voiture"
        :last-year="years[years.length - 1]"
        :counter-count-text="`${veloResult.counterCount} compteurs vélo, ${voitureResult.counterCount} compteurs voiture`"
        @close="dialogOpen = false"
      />

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm border border-gray-200">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-3 py-2 text-left font-semibold">Série</th>
              <th v-for="year in years" :key="year" class="px-3 py-2 text-right font-semibold">
                {{ year }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="bg-white">
              <td class="px-3 py-2 font-medium align-top text-lvv-pink">
                Vélo
                <div class="text-xs text-gray-500 font-normal">{{ veloResult.counterCount }} compteurs</div>
              </td>
              <td
                v-for="(value, idx) in veloResult.indices"
                :key="idx"
                class="px-3 py-2 text-right tabular-nums align-top whitespace-nowrap"
              >
                <div>{{ value === null ? '–' : value.toFixed(1) }}</div>
                <div
                  v-if="formatYoY(veloResult.indices, idx)"
                  class="text-xs whitespace-nowrap"
                  :class="yoyClass(veloResult.indices, idx, 'velo')"
                >
                  {{ formatYoY(veloResult.indices, idx) }}
                </div>
              </td>
            </tr>
            <tr class="bg-gray-50 border-t border-gray-200">
              <td class="px-3 py-2 font-medium align-top text-lvv-blue-600">
                Voiture
                <div class="text-xs text-gray-500 font-normal">{{ voitureResult.counterCount }} compteurs</div>
              </td>
              <td
                v-for="(value, idx) in voitureResult.indices"
                :key="idx"
                class="px-3 py-2 text-right tabular-nums align-top whitespace-nowrap"
              >
                <div>{{ value === null ? '–' : value.toFixed(1) }}</div>
                <div
                  v-if="formatYoY(voitureResult.indices, idx)"
                  class="text-xs whitespace-nowrap"
                  :class="yoyClass(voitureResult.indices, idx, 'voiture')"
                >
                  {{ formatYoY(voitureResult.indices, idx) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';

const props = defineProps<{
  veloCounters: Collections['compteurs'][];
  voitureCounters: Collections['compteurs'][];
}>();

const { computeIndex, yoyDelta } = useMetropoleIndex();

const expanded = ref(false);
const dialogOpen = ref(false);

const veloResult = computed(() => computeIndex(props.veloCounters, { aggregation: 'aggregate' }));
const voitureResult = computed(() => computeIndex(props.voitureCounters, { aggregation: 'aggregate' }));

const years = computed(() => {
  const a = veloResult.value.years;
  const b = voitureResult.value.years;
  return a.length >= b.length ? a : b;
});

function buildSummary(indices: (number | null)[], yrs: number[], kind: 'velo' | 'voiture'): string {
  if (indices.length < 2) {
    return 'données insuffisantes.';
  }

  const last = indices[indices.length - 1];
  if (last === null || last === undefined) {
    return 'données insuffisantes.';
  }

  const lastYr = yrs[yrs.length - 1];
  const totalDelta = last - 100;
  const span = yrs.length - 1;
  const cagr = span > 0 ? (Math.pow(last / 100, 1 / span) - 1) * 100 : 0;
  const totalSign = totalDelta >= 0 ? '+' : '';
  const cagrSign = cagr >= 0 ? '+' : '';
  const verb = kind === 'velo' ? 'augmenté' : totalDelta >= 0 ? 'augmenté' : 'baissé';
  const totalAbs = Math.abs(totalDelta).toFixed(1);

  return `entre 2019 et ${lastYr}, la fréquentation a ${verb} de ${totalSign}${totalAbs} %, soit ${cagrSign}${cagr.toFixed(1)} % par an en moyenne.`;
}

const veloSummary = computed(() => buildSummary(veloResult.value.indices, veloResult.value.years, 'velo'));

const voitureSummary = computed(() => buildSummary(voitureResult.value.indices, voitureResult.value.years, 'voiture'));

function formatYoY(indices: (number | null)[], idx: number): string | null {
  const delta = yoyDelta(indices, idx);
  if (delta === null) {
    return null;
  }

  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)} %`;
}

function yoyClass(indices: (number | null)[], idx: number, kind: 'velo' | 'voiture'): string {
  const delta = yoyDelta(indices, idx);
  if (delta === null) {
    return '';
  }

  if (kind === 'velo') {
    if (delta > 0) return 'text-emerald-600';
    if (delta < 0) return 'text-red-600';
  } else {
    if (delta < 0) return 'text-emerald-600';
    if (delta > 0) return 'text-red-600';
  }

  return 'text-gray-500';
}

const chartOptions = computed(() => ({
  chart: { type: 'line', height: 380, backgroundColor: '#FFFFFF' },
  title: { text: undefined },
  credits: { enabled: false },
  xAxis: { categories: years.value.map((y) => String(y)), title: { text: undefined } },
  yAxis: {
    min: 0,
    title: { text: 'Indice (base 100 en 2019)' },
    plotLines: [{ value: 100, color: '#9CA3AF', width: 1, dashStyle: 'Dot' }],
  },
  tooltip: { shared: true, valueDecimals: 1 },
  plotOptions: { line: { marker: { enabled: true, radius: 4 } } },
  legend: { itemStyle: { fontSize: '12px' } },
  series: [
    {
      type: 'line',
      name: 'Fréquentation vélo (base 100 - 2019)',
      color: '#C84271',
      lineWidth: 3,
      data: veloResult.value.indices.map((v) => (v === null ? null : Math.round(v * 10) / 10)),
      dataLabels: {
        enabled: true,
        format: '{point.y:.1f}',
        style: { fontSize: '11px', fontWeight: '600', textOutline: '2px white' },
        y: -8,
      },
    },
    {
      type: 'line',
      name: 'Fréquentation voiture (base 100 - 2019)',
      color: '#152B68',
      lineWidth: 3,
      data: voitureResult.value.indices.map((v) => (v === null ? null : Math.round(v * 10) / 10)),
      dataLabels: {
        enabled: true,
        format: '{point.y:.1f}',
        style: { fontSize: '11px', fontWeight: '600', textOutline: '2px white' },
        y: 16,
      },
    },
  ],
  responsive: {
    rules: [
      {
        condition: { maxWidth: 500 },
        chartOptions: {
          yAxis: { title: { text: undefined } },
          legend: { layout: 'horizontal', align: 'center', verticalAlign: 'bottom' },
        },
      },
    ],
  },
}));
</script>
