<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <button type="button" class="flex items-start gap-2 text-left flex-1 min-w-0" @click="expanded = !expanded">
        <Icon
          :name="expanded ? 'mdi:chevron-down' : 'mdi:chevron-right'"
          class="text-xl text-gray-500 flex-shrink-0 mt-0.5"
        />
        <div class="min-w-0">
          <h3 class="text-lg font-semibold text-gray-900">Évolution de la fréquentation {{ kindLabel }} depuis 2019</h3>
          <p class="text-sm italic text-gray-700 text-center">
            {{ summary }}
          </p>
        </div>
      </button>
      <div v-if="expanded" class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          @click.stop="dialogOpen = true"
        >
          <Icon name="mdi:information-outline" class="text-base" />
          Méthodologie
        </button>
      </div>
    </div>

    <div v-if="expanded" class="mt-4 space-y-6">
      <div>
        <ClientOnly>
          <highcharts :options="chartOptions" />
        </ClientOnly>
      </div>

      <div class="space-y-6">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm border border-gray-200">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">Série</th>
                <th v-for="year in result.years" :key="year" class="px-3 py-2 text-right font-semibold">
                  {{ year }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="bg-white">
                <td class="px-3 py-2 font-medium align-top">
                  Fréquentation
                  <div class="text-xs text-gray-500 font-normal">{{ result.counterCount }} compteurs</div>
                </td>
                <td
                  v-for="(value, idx) in result.indices"
                  :key="idx"
                  class="px-3 py-2 text-right tabular-nums align-top whitespace-nowrap"
                >
                  <div>{{ value === null ? '–' : value.toFixed(1) }}</div>
                  <div
                    v-if="formatYoY(result.indices, idx)"
                    class="text-xs whitespace-nowrap"
                    :class="yoyClass(result.indices, idx)"
                  >
                    {{ formatYoY(result.indices, idx) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="lg:hidden rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-600 flex items-start gap-2"
        >
          <Icon name="mdi:monitor" class="text-base text-gray-500 mt-0.5 flex-shrink-0" />
          <span>
            Le détail par compteur (courbe de tendance, contribution annuelle, etc.) est disponible sur un écran plus
            large.
          </span>
        </div>
        <div class="hidden lg:block overflow-x-auto">
          <h4 class="text-sm font-semibold text-gray-900 mb-2">
            Détail par compteur
            <span class="font-normal text-gray-500">
              ({{ retainedCount }} retenus / {{ details.rows.length }} total)
            </span>
          </h4>
          <p class="text-xs text-gray-500 mb-2">
            Chaque cellule indique le total de passages enregistrés cette année-là sur ce compteur. Les années
            partielles (mois en panne) sont signalées sous le total. Les compteurs sans données 2019 ou sans aucune
            année ultérieure exploitable (minimum 6 mois en commun avec 2019) ne contribuent pas à l'indice et
            apparaissent grisés. Les taux de croissance sont calculés uniquement sur les mois communs entre les périodes
            comparées.
          </p>
          <table class="min-w-full text-xs border border-gray-200">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-2 py-2 text-left font-semibold w-6"></th>
                <th class="px-2 py-2 text-left font-semibold">Compteur</th>
                <th class="px-2 py-2 text-right font-semibold">Évol. globale</th>
                <th class="px-2 py-2 text-center font-semibold">Tendance</th>
                <th class="px-2 py-2 text-right font-semibold">Dispo.</th>
                <th class="px-2 py-2 text-center font-semibold">Statut</th>
                <th v-for="year in details.years" :key="year" class="px-2 py-2 text-right font-semibold">
                  {{ year }}
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="row in visibleRows" :key="row.name">
                <tr
                  :class="[
                    row.status.state === 'retained' ? 'odd:bg-white even:bg-gray-50' : 'bg-gray-50 text-gray-500',
                    'cursor-pointer hover:bg-lvv-blue-100/40',
                  ]"
                  @click="toggleExpanded(row.name)"
                  @mouseenter="emit('highlight', row.name)"
                  @mouseleave="emit('highlight', null)"
                >
                  <td class="px-2 py-1.5 align-top text-center">
                    <Icon
                      :name="expandedRow === row.name ? 'mdi:chevron-down' : 'mdi:chevron-right'"
                      class="text-base text-gray-500"
                    />
                  </td>
                  <td class="px-2 py-1.5 align-top">
                    <div class="font-medium line-clamp-1" :title="row.name">{{ row.name }}</div>
                    <div v-if="row.arrondissement" class="text-[10px] text-gray-500 line-clamp-1">
                      {{ row.arrondissement }}
                    </div>
                  </td>
                  <td
                    class="px-2 py-1.5 text-right tabular-nums align-top font-medium"
                    :class="deltaClass(row.totalGrowth)"
                  >
                    {{ formatDelta(row.totalGrowth) }}
                  </td>
                  <td class="px-2 py-1.5 text-center align-middle">
                    <ChartSparkline
                      v-if="row.yearlyTotals.some((v) => v > 0)"
                      :values="row.yearlyTotals"
                      :color="row.status.state === 'retained' ? kindColor : '#9CA3AF'"
                      :width="80"
                      :height="22"
                      :aria-label="`Tendance ${row.name}`"
                    />
                  </td>
                  <td class="px-2 py-1.5 text-right tabular-nums align-top">
                    {{ row.status.availabilityPct.toFixed(0) }}%
                  </td>
                  <td class="px-2 py-1.5 text-center align-top whitespace-nowrap">
                    <span
                      v-if="row.status.state === 'retained'"
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium"
                      >Retenu</span
                    >
                    <span
                      v-else-if="row.status.state === 'no-2019'"
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] font-medium"
                      >Sans 2019</span
                    >
                    <span
                      v-else
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-medium"
                      >Insuffisant</span
                    >
                  </td>
                  <td
                    v-for="(detail, yIdx) in row.perYear"
                    :key="yIdx"
                    class="px-2 py-1.5 text-right tabular-nums align-top whitespace-nowrap"
                    :class="cellClass(row, detail)"
                    :title="cellTitle(detail)"
                  >
                    <template v-if="detail && detail.yearTotal > 0">
                      <div>{{ formatTotal(detail.yearTotal) }}</div>
                      <div
                        v-if="detail.yoyDelta !== null"
                        class="text-[10px] font-medium leading-tight"
                        :class="deltaClass(detail.yoyDelta)"
                      >
                        {{ formatDelta(detail.yoyDelta) }}
                      </div>
                      <div v-else-if="detail.yearMonthsAvailable < 12" class="text-[10px] text-orange-600 font-normal">
                        {{ detail.yearMonthsAvailable }}/12 m.
                      </div>
                    </template>
                    <template v-else>·</template>
                  </td>
                </tr>
                <tr v-if="expandedRow === row.name" :key="`${row.name}-detail`" class="bg-lvv-blue-100/30">
                  <td :colspan="6 + details.years.length" class="px-3 py-3">
                    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <h5 class="text-sm font-semibold text-gray-900">Détail mensuel — {{ row.name }}</h5>
                      <NuxtLink v-if="row.path" :to="row.path" class="text-xs text-lvv-blue-600 hover:underline">
                        Voir la fiche complète
                        <Icon name="mdi:arrow-right" class="text-xs" />
                      </NuxtLink>
                    </div>
                    <ClientOnly>
                      <highcharts :options="monthlyChartFor(row)" />
                    </ClientOnly>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <ChartMethodologyDialog
      :open="dialogOpen"
      :kind-label="kindLabel"
      :last-year="result.lastYear"
      :counter-count-text="`${result.counterCount} compteurs retenus`"
      @close="dialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content';

const props = withDefaults(
  defineProps<{
    counters: Collections['compteurs'][];
    kind?: 'velo' | 'voiture';
  }>(),
  { kind: 'velo' },
);

const emit = defineEmits<{
  highlight: [name: string | null];
}>();

const kindLabel = computed(() => (props.kind === 'velo' ? 'vélo' : 'voiture'));
const kindColor = computed(() => (props.kind === 'velo' ? '#C84271' : '#152B68'));

const { computeIndex, computeCounterDetails, yoyDelta, MIN_MATCHED_MONTHS_PER_YEAR } = useMetropoleIndex();

const expanded = ref(false);
const dialogOpen = ref(false);
const expandedRow = ref<string | null>(null);

function toggleExpanded(name: string) {
  expandedRow.value = expandedRow.value === name ? null : name;
}

function monthlyChartFor(row: { name: string; monthly: { month: string; count: number }[] }) {
  const data = row.monthly.slice().sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  return {
    chart: { type: 'column', height: 240, backgroundColor: 'transparent' },
    title: { text: undefined },
    credits: { enabled: false },
    xAxis: {
      categories: data.map((d) => new Date(d.month).toLocaleString('fr-FR', { month: 'short', year: '2-digit' })),
      labels: { autoRotation: [-45], style: { fontSize: '10px' } },
      tickInterval: Math.max(1, Math.floor(data.length / 12)),
    },
    yAxis: { min: 0, title: { text: 'Passages' } },
    tooltip: { valueSuffix: ' passages' },
    plotOptions: { column: { pointPadding: 0.05, borderWidth: 0 } },
    legend: { enabled: false },
    series: [
      {
        type: 'column',
        name: row.name,
        color: kindColor.value,
        data: data.map((d) => d.count),
      },
    ],
  };
}

const result = computed(() => computeIndex(props.counters, { aggregation: 'aggregate' }));

const details = computed(() => computeCounterDetails(props.counters));

const retainedCount = computed(() => details.value.rows.filter((r) => r.status.state === 'retained').length);

const visibleRows = computed(() => details.value.rows);

function cellClass(
  row: { status: { state: string } },
  detail: { matchedMonths: number; yearMonthsAvailable: number } | null,
): string {
  if (row.status.state === 'no-2019') {
    return 'text-gray-400';
  }

  if (!detail || detail.matchedMonths === 0) {
    return 'text-gray-400';
  }

  if (detail.matchedMonths < MIN_MATCHED_MONTHS_PER_YEAR) {
    return 'text-orange-300';
  }

  return 'text-emerald-700';
}

function cellTitle(
  detail: { matchedMonths: number; yearMonthsAvailable: number; yearTotal: number; yoyDelta: number | null } | null,
): string {
  if (!detail) {
    return '';
  }

  const eligibility = detail.matchedMonths >= MIN_MATCHED_MONTHS_PER_YEAR ? 'Retenu' : 'Écarté (< 6 mois communs)';
  let title = `${eligibility} : ${detail.matchedMonths} mois retenus, ${detail.yearMonthsAvailable} mois avec données, total ${detail.yearTotal.toLocaleString('fr-FR')} passages`;
  if (detail.yoyDelta !== null) {
    title += ` (${formatDelta(detail.yoyDelta)} par rapport à l'année précédente sur les mois communs)`;
  }
  return title;
}

function formatTotal(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)} M`;
  }

  if (n >= 10_000) {
    return `${Math.round(n / 1000)} k`;
  }

  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)} k`;
  }

  return n.toLocaleString('fr-FR');
}

function formatDelta(d: number | null): string {
  if (d === null) return '–';
  const sign = d > 0 ? '+' : '';
  return `${sign}${d.toFixed(0)}%`;
}

function deltaClass(d: number | null): string {
  if (d === null) return 'text-gray-400';
  if (props.kind === 'velo') {
    return d > 0 ? 'text-emerald-600' : 'text-red-600';
  }
  return d < 0 ? 'text-emerald-600' : 'text-red-600';
}

const summary = computed(() => {
  const indices = result.value.indices;
  if (indices.length < 2) {
    return null;
  }

  const last = indices[indices.length - 1];
  if (last === null || last === undefined) {
    return null;
  }

  const yrs = result.value.years;
  const lastYr = yrs[yrs.length - 1];
  const totalDelta = last - 100;
  const span = yrs.length - 1;
  const cagr = span > 0 ? (Math.pow(last / 100, 1 / span) - 1) * 100 : 0;
  const totalSign = totalDelta >= 0 ? '+' : '';
  const cagrSign = cagr >= 0 ? '+' : '';
  const verb = totalDelta >= 0 ? 'augmenté' : 'baissé';
  const totalAbs = Math.abs(totalDelta).toFixed(1);

  return `Entre 2019 et ${lastYr}, d'après les compteurs, la fréquentation ${kindLabel.value} a ${verb} de ${totalSign}${totalAbs} %, soit ${cagrSign}${cagr.toFixed(1)} % par an en moyenne.`;
});

function formatYoY(indices: (number | null)[], idx: number): string | null {
  const delta = yoyDelta(indices, idx);
  if (delta === null) {
    return null;
  }

  const sign = delta > 0 ? '+' : '';

  return `${sign}${delta.toFixed(1)} %`;
}

function yoyClass(indices: (number | null)[], idx: number): string {
  const delta = yoyDelta(indices, idx);
  if (delta === null) return '';
  if (delta > 0) return 'text-emerald-600';
  if (delta < 0) return 'text-red-600';
  return 'text-gray-500';
}

const chartOptions = computed(() => {
  const r = result.value;

  return {
    chart: { type: 'line', height: 360, backgroundColor: '#FFFFFF' },
    title: { text: undefined },
    credits: { enabled: false },
    xAxis: { categories: r.years.map((y) => String(y)), title: { text: undefined } },
    yAxis: {
      min: 50,
      title: { text: 'Indice (base 100 en 2019)' },
      plotLines: [{ value: 100, color: '#9CA3AF', width: 1, dashStyle: 'Dot' }],
    },
    tooltip: { shared: true, valueDecimals: 1 },
    plotOptions: { line: { marker: { enabled: true, radius: 4 } } },
    legend: { itemStyle: { fontSize: '12px' } },
    series: [
      {
        type: 'line',
        name: `Fréquentation ${kindLabel.value} (base 100 - 2019)`,
        color: kindColor.value,
        lineWidth: 3,
        data: r.indices.map((v) => (v === null ? null : Math.round(v * 10) / 10)),
        dataLabels: {
          enabled: true,
          format: '{point.y:.1f}',
          style: { fontSize: '11px', fontWeight: '600', textOutline: '2px white' },
          y: -8,
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
  };
});
</script>
