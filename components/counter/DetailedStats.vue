<template>
  <p v-if="status === 'error'" class="mt-8 text-sm italic">
    Les statistiques détaillées de ce compteur (heures de pointe, évolution journalière, records) sont momentanément
    indisponibles.
  </p>

  <div v-else>
    <ProseH2 :id="anchor('semaine-weekend-et-vacances')">Semaine, weekend et vacances</ProseH2>
    <p>
      Fréquentation moyenne selon le type de jour, et répartition des {{ unit }} au fil de la journée, sur la période
      choisie ci-dessous (par défaut les douze derniers mois), hors jours de panne du compteur. Les jours ouvrés sont
      séparés entre période scolaire et vacances scolaires (académie de Lyon). La moyenne par jour de la semaine exclut
      les vacances scolaires et les jours fériés.
    </p>

    <CounterPeriodSelect v-model="period" :years="years" :current-year="currentYear" />

    <div class="mt-4 grid grid-cols-2 gap-3" :class="{ 'sm:grid-cols-4': !embedded }">
      <template v-if="profile">
        <div class="bg-white rounded-lg shadow-sm p-4 text-center">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Jour ouvré</div>
          <div class="text-2xl font-bold text-lvv-blue-600 mt-1">
            {{ formatOptionalCount(profile.averages.weekday) }}
          </div>
          <div class="text-xs text-gray-500 mt-1">hors vacances scolaires</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4 text-center">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Vacances scolaires</div>
          <div class="text-2xl font-bold mt-1" :style="{ color: SCHOOL_HOLIDAY_COLOR }">
            {{ formatOptionalCount(profile.averages.schoolHoliday) }}
          </div>
          <div class="text-xs text-gray-500 mt-1">{{ gapLabel(profile.averages.schoolHoliday) }}</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4 text-center">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Weekend et fériés</div>
          <div class="text-2xl font-bold text-lvv-pink mt-1">{{ formatOptionalCount(profile.averages.weekend) }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ gapLabel(profile.averages.weekend) }}</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4 text-center">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Heures de pointe</div>
          <div class="text-2xl font-bold text-lvv-blue-600 mt-1">{{ peakHoursLabel }}</div>
          <div class="text-xs text-gray-500 mt-1">jours ouvrés hors vacances</div>
        </div>
      </template>
      <template v-else>
        <div v-for="i in 4" :key="i" class="h-[104px] bg-gray-100 rounded-lg animate-pulse" />
      </template>
    </div>

    <template v-if="profile">
      <ChartHourlyProfile
        :unit="unit"
        :title="`${unitLabel} par heure - ${name}`"
        :subtitle="periodLabel"
        :stats="profile"
        class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
      />
      <ChartWeekdayProfile
        :unit="unit"
        :title="`${unitLabel} par jour de la semaine - ${name}`"
        :subtitle="periodLabel"
        :stats="profile"
        class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
      />
    </template>
    <div v-else class="mt-8 h-[340px] bg-gray-100 rounded-lg animate-pulse" />

    <ProseH2 :id="anchor('evolution-journaliere')">Évolution journalière</ProseH2>
    <p>
      Nombre de {{ unit }} chaque jour. La moyenne sur 7 jours lisse l'alternance semaine / weekend et fait ressortir
      les tendances : vacances, météo, grèves…
    </p>
    <ChartDailyEvolution
      v-if="stats"
      :unit="unit"
      :title="`${dailyTitle} - ${name}`"
      :stats="stats"
      :live-days="liveDays"
      :highlighted-days="hourlyDays"
      :sync-url="!embedded"
      class="mt-8 lg:p-4 lg:rounded-lg lg:shadow-md"
      @select-day="addHourlyDay"
    />
    <div v-else class="mt-8 h-[380px] bg-gray-100 rounded-lg animate-pulse" />

    <ProseH3 :id="anchor('heure-par-heure')" ref="hourlyHeading">Heure par heure</ProseH3>
    <p>Cliquez sur une journée du graphique ou sur un record, ou choisissez une date pour la voir heure par heure.</p>
    <ChartHourlyDays
      v-if="stats"
      :unit="unit"
      :counter="counter"
      :title="`${unitLabel} heure par heure - ${name}`"
      :stats="stats"
      :live-days="liveDays"
      :days="hourlyDays"
      class="mt-4 lg:p-4 lg:rounded-lg lg:shadow-md"
      @add="addHourlyDay"
      @remove="removeHourlyDay"
    />

    <ProseH2 :id="anchor('records')">Records</ProseH2>
    <p>Les journées les plus fréquentées depuis la mise en service du compteur.</p>

    <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <template v-if="stats">
        <a
          v-if="stats.records.allTime"
          href="#heure-par-heure"
          class="not-prose relative block bg-white rounded-lg shadow-sm p-4 text-center transition-shadow hover:shadow-md"
          @click.prevent="showHourlyDay(stats.records.allTime.day)"
        >
          <span
            v-if="isRecent(stats.records.allTime.day)"
            class="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-lvv-pink text-white text-xs font-semibold"
          >
            Nouveau record
          </span>
          <div class="text-xs text-gray-500 uppercase tracking-wide">Record journalier</div>
          <div class="text-2xl font-bold text-lvv-pink mt-1">{{ formatCount(stats.records.allTime.count) }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ formatDay(stats.records.allTime.day) }}</div>
        </a>
        <a
          v-if="lastYearRecord"
          href="#heure-par-heure"
          class="not-prose block bg-white rounded-lg shadow-sm p-4 text-center transition-shadow hover:shadow-md"
          @click.prevent="showHourlyDay(lastYearRecord.day)"
        >
          <div class="text-xs text-gray-500 uppercase tracking-wide">Record {{ lastYearRecord.year }}</div>
          <div class="text-2xl font-bold text-lvv-blue-600 mt-1">{{ formatCount(lastYearRecord.count) }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ formatDay(lastYearRecord.day) }}</div>
        </a>
        <a
          v-if="stats.records.hour"
          href="#heure-par-heure"
          class="not-prose block bg-white rounded-lg shadow-sm p-4 text-center transition-shadow hover:shadow-md"
          @click.prevent="showHourlyDay(stats.records.hour.day)"
        >
          <div class="text-xs text-gray-500 uppercase tracking-wide">Record horaire</div>
          <div class="text-2xl font-bold text-lvv-blue-600 mt-1">{{ formatCount(stats.records.hour.count) }}</div>
          <div class="text-xs text-gray-500 mt-1">
            {{ formatDay(stats.records.hour.day) }}, {{ stats.records.hour.hour }}h – {{ stats.records.hour.hour + 1 }}h
          </div>
        </a>
      </template>
      <template v-else>
        <div v-for="i in 3" :key="i" class="h-[104px] bg-gray-100 rounded-lg animate-pulse" />
      </template>
    </div>

    <div v-if="stats" class="grid grid-cols-1 gap-x-8" :class="{ 'lg:grid-cols-2': !embedded }">
      <div>
        <h3>Les 10 meilleures journées</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th class="text-right">{{ unitLabel }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in stats.records.top" :key="record.day">
              <td class="tabular-nums">{{ index + 1 }}</td>
              <td>
                <a href="#heure-par-heure" @click.prevent="showHourlyDay(record.day)">
                  {{ formatDay(record.day, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }}
                </a>
              </td>
              <td class="text-right tabular-nums">{{ formatCount(record.count) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <h3>Record de chaque année</h3>
        <table>
          <thead>
            <tr>
              <th>Année</th>
              <th>Date</th>
              <th class="text-right">{{ unitLabel }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in recordsByYear" :key="record.year">
              <td class="tabular-nums">
                {{ record.year }}
                <span v-if="record.year === currentYear" class="text-xs text-gray-400">(en cours)</span>
              </td>
              <td>
                <a href="#heure-par-heure" @click.prevent="showHourlyDay(record.day)">
                  {{ formatDay(record.day, { day: 'numeric', month: 'short' }) }}
                </a>
              </td>
              <td class="text-right tabular-nums">{{ formatCount(record.count) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import {
  DAY_COMPARISON_COLORS,
  SCHOOL_HOLIDAY_COLOR,
  capitalize,
  dayToTimestamp,
  formatCount,
  formatDay,
  monthsRange,
  selectProfile,
  statsPeriodLabel,
  statsPeriodQueryParam,
  useCounterDetailedStats,
  useCounterLiveDays,
  useCounterPeriodStats,
  useCounterYearlyStats,
  type CounterRef,
  type SelectedDay,
  type StatsPeriod,
} from '~/composables/useCounterDetailedStats';
import { useQueryParam, useUrlHash } from '~/composables/useQueryParam';

const RECENT_RECORD_DAYS = 30;

const props = defineProps<{ counter: CounterRef; name: string; embedded?: boolean }>();

const unit = computed(() => (props.counter.type === 'velo' ? 'passages' : 'véhicules'));
const unitLabel = computed(() => capitalize(unit.value));
const dailyTitle = computed(() =>
  props.counter.type === 'velo' ? 'Fréquentation cycliste journalière' : 'Fréquentation voiture journalière',
);

const { data: stats, status } = useCounterDetailedStats(props.counter);
const { data: liveDays } = useCounterLiveDays(props.counter);
const { data: yearly } = useCounterYearlyStats(props.counter);

const period = ref<StatsPeriod>('recent');
const monthsPeriodRange = computed(() => monthsRange(period.value, stats.value?.lastDay));
const { data: monthsStats } = useCounterPeriodStats(props.counter, monthsPeriodRange);
const profile = computed(() => selectProfile(period.value, stats.value, yearly.value, monthsStats.value));
const years = computed(() =>
  (yearly.value ?? [])
    .filter((year) => year.averages.weekday !== null)
    .map((year) => year.year)
    .sort((a, b) => b - a),
);

const hourlyDays = ref<SelectedDay[]>([]);
if (!props.embedded) {
  useQueryParam('profil-periode', period, statsPeriodQueryParam());
  useQueryParam('horaire', hourlyDays, {
    parse: (value) => {
      const days = [...new Set(value.split(','))]
        .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day))
        .slice(0, DAY_COMPARISON_COLORS.length);
      return days.length > 0 ? days.map((day, index) => ({ day, color: DAY_COMPARISON_COLORS[index]! })) : undefined;
    },
    serialize: (days) => days.map((selected) => selected.day).join(','),
  });
}

function addHourlyDay(day: string) {
  if (hourlyDays.value.some((selected) => selected.day === day)) {
    return;
  }

  const kept = hourlyDays.value.slice(-(DAY_COMPARISON_COLORS.length - 1));
  const usedColors = new Set(kept.map((selected) => selected.color));
  const color = DAY_COMPARISON_COLORS.find((candidate) => !usedColors.has(candidate)) ?? DAY_COMPARISON_COLORS[0];
  hourlyDays.value = [...kept, { day, color }];
}

const setUrlHash = useUrlHash();
const hourlyHeading = ref<ComponentPublicInstance | null>(null);

function showHourlyDay(day: string) {
  addHourlyDay(day);
  if (props.embedded || window.location.hash === '#heure-par-heure') {
    hourlyHeading.value?.$el.scrollIntoView({ behavior: 'smooth' });
  } else {
    setUrlHash('#heure-par-heure');
  }
}

function anchor(id: string): string | undefined {
  return props.embedded ? undefined : id;
}

function removeHourlyDay(day: string) {
  hourlyDays.value = hourlyDays.value.filter((selected) => selected.day !== day);
}

const currentYear = computed(() => (stats.value ? Number(stats.value.lastDay.slice(0, 4)) : null));

const periodLabel = computed(() =>
  statsPeriodLabel(
    period.value,
    period.value === 'recent' ? stats.value?.period : monthsPeriodRange.value,
    currentYear.value,
  ),
);

const lastYearRecord = computed(() => {
  const byYear = stats.value?.records.byYear ?? [];
  const current = byYear.find((record) => record.year === currentYear.value);
  if (current && current.day === stats.value?.records.allTime?.day) {
    return byYear.find((record) => record.year === currentYear.value! - 1) ?? null;
  }

  return current ?? null;
});

const recordsByYear = computed(() => [...(stats.value?.records.byYear ?? [])].reverse());

function gapLabel(average: number | null): string {
  const weekday = profile.value?.averages.weekday;
  if (!weekday || average === null) {
    return `${unit.value} / jour`;
  }

  const gap = Math.round((average / weekday - 1) * 100);
  return `${gap > 0 ? '+' : gap < 0 ? '−' : ''}${Math.abs(gap)} % par rapport au jour ouvré`;
}

const peakHoursLabel = computed(() => {
  const { morning, evening } = profile.value?.peakHours ?? {};
  return [morning, evening]
    .filter((peak) => peak)
    .map((peak) => `${peak!.hour}h`)
    .join(' · ');
});

function formatOptionalCount(count: number | null): string {
  return count === null ? '–' : formatCount(count);
}

function isRecent(day: string): boolean {
  if (!stats.value) {
    return false;
  }

  return dayToTimestamp(stats.value.lastDay) - dayToTimestamp(day) < RECENT_RECORD_DAYS * 24 * 60 * 60 * 1000;
}
</script>
