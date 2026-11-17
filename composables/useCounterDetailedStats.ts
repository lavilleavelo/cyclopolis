import type { Ref } from 'vue';
import type { QueryParamCodec } from '~/composables/useQueryParam';

export type DayCount = { day: string; count: number };
export type HourPeak = { hour: number; count: number };
export type SchoolHoliday = { start: string; end: string; name: string };

export type DayType = 'weekday' | 'schoolHoliday' | 'weekend';

export type CounterRef = { type: 'velo'; idPdc: number } | { type: 'voiture'; idsPdc: number[] };

export type CounterDetailedStats = {
  idPdc?: number;
  name?: string;
  pointIds?: number[];
  quality?: { measuredShare: number | null };
  points?: CarPointStats[];
  firstDay: string;
  lastDay: string;
  syncedAt: string | null;
  daily: { start: string; values: (number | null)[]; holidays: string[]; schoolHolidays: SchoolHoliday[] };
  period: { from: string; to: string };
  averages: Record<DayType, number | null>;
  hourlyProfile: Record<DayType, (number | null)[]>;
  weekdayProfile: (number | null)[];
  peakHours: { morning: HourPeak | null; evening: HourPeak | null; weekend: HourPeak | null };
  records: {
    allTime: DayCount | null;
    byYear: (DayCount & { year: number })[];
    top: DayCount[];
    hour: (DayCount & { hour: number }) | null;
  };
};

export type DayRange = { from: string; to: string };

export type CarPointStats = {
  id: number;
  average: number | null;
  share: number | null;
  measuredShare: number | null;
  lastDay?: string | null;
  gaps?: DayRange[];
};

export const WEEKDAY_COLOR = '#152B68';
export const SCHOOL_HOLIDAY_COLOR = '#4F8FD6';
export const WEEKEND_COLOR = '#C84271';
export const DAY_COMPARISON_COLORS = ['#152B68', '#EA580C', '#0891B2', '#9333EA'];

export const VELO_COLOR = '#C84271';
export const VOITURE_COLOR = '#152B68';

function counterKey(counter: CounterRef): string {
  return counter.type === 'velo' ? `velo-${counter.idPdc}` : `voiture-${counter.idsPdc.join('-')}`;
}

function counterEndpoint(counter: CounterRef, endpoint: 'stats' | 'live' | 'hours' | 'yearly') {
  const { counterStatsApiUrl } = useRuntimeConfig().public;
  if (counter.type === 'velo') {
    return { url: `${counterStatsApiUrl}/api/counters/${counter.idPdc}/${endpoint}`, query: {} };
  }
  return { url: `${counterStatsApiUrl}/api/car-counters/${endpoint}`, query: { ids: counter.idsPdc.join(',') } };
}

export function useCounterDetailedStats(counter: CounterRef) {
  const { url, query } = counterEndpoint(counter, 'stats');
  return useFetch<CounterDetailedStats>(url, {
    query,
    key: `counter-detailed-stats-${counterKey(counter)}`,
    server: false,
    lazy: true,
  });
}

export type CounterProfile = Pick<CounterDetailedStats, 'averages' | 'hourlyProfile' | 'weekdayProfile' | 'peakHours'>;

export type YearlyStats = CounterProfile & { year: number; days: number; measuredShare?: number | null };

export function useCounterYearlyStats(counter: CounterRef) {
  const { url, query } = counterEndpoint(counter, 'yearly');
  return useFetch<YearlyStats[]>(url, {
    query,
    key: `counter-yearly-stats-${counterKey(counter)}`,
    server: false,
    lazy: true,
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

export type StatsRange = { from: string; to: string };

export type StatsPeriod = 'recent' | '3-mois' | '6-mois' | number | StatsRange;

export const STATS_PERIOD_OPTIONS: { value: Exclude<StatsPeriod, StatsRange>; label: string; months?: number }[] = [
  { value: '3-mois', label: '3 derniers mois', months: 3 },
  { value: '6-mois', label: '6 derniers mois', months: 6 },
  { value: 'recent', label: '12 derniers mois' },
];

const RECENT_MONTHS = 12;
const RANGE_QUERY_PATTERN = /^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/;

export function isStatsRange(period: StatsPeriod): period is StatsRange {
  return typeof period === 'object';
}

export function statsPeriodQueryParam(): QueryParamCodec<StatsPeriod> {
  return {
    parse: (value) => {
      if (/^\d{4}$/.test(value)) {
        return Number(value);
      }

      const [, from, to] = RANGE_QUERY_PATTERN.exec(value) ?? [];
      if (from && to) {
        return isValidDay(from) && isValidDay(to) && from <= to ? { from, to } : undefined;
      }

      return STATS_PERIOD_OPTIONS.find((option) => option.value === value)?.value;
    },
    serialize: (value) => (isStatsRange(value) ? `${value.from}_${value.to}` : String(value)),
  };
}

function isValidDay(day: string): boolean {
  return !Number.isNaN(dayToTimestamp(day));
}

function lastMonthsRange(months: number, lastDay: string): StatsRange {
  const next = new Date(dayToTimestamp(lastDay) + DAY_MS);
  const month = next.getUTCMonth() - months;
  const lastDayOfMonth = new Date(Date.UTC(next.getUTCFullYear(), month + 1, 0)).getUTCDate();
  const from = new Date(Date.UTC(next.getUTCFullYear(), month, Math.min(next.getUTCDate(), lastDayOfMonth)));
  return { from: from.toISOString().slice(0, 10), to: lastDay };
}

// Range to fetch for the period: null when its stats are already loaded (last 12 months, calendar years)
export function statsPeriodRange(period: StatsPeriod, lastDay: string | null | undefined): StatsRange | null {
  if (isStatsRange(period)) {
    return period;
  }

  const months = STATS_PERIOD_OPTIONS.find((option) => option.value === period)?.months;
  return months && lastDay ? lastMonthsRange(months, lastDay) : null;
}

// Starting point of a custom range: the dates of the period currently displayed
export function customRangeFrom(period: StatsPeriod, firstDay: string, lastDay: string): StatsRange {
  if (isStatsRange(period)) {
    return period;
  }

  if (typeof period === 'number') {
    const from = `${period}-01-01`;
    const to = `${period}-12-31`;
    return { from: from > firstDay ? from : firstDay, to: to < lastDay ? to : lastDay };
  }

  const range = statsPeriodRange(period, lastDay) ?? lastMonthsRange(RECENT_MONTHS, lastDay);
  return { from: range.from > firstDay ? range.from : firstDay, to: range.to };
}

export function useCounterPeriodStats(counter: CounterRef, range: Ref<StatsRange | null>) {
  const { url, query } = counterEndpoint(counter, 'stats');
  return useAsyncData(
    () => `counter-period-stats-${counterKey(counter)}-${range.value?.from ?? ''}-${range.value?.to ?? ''}`,
    () =>
      range.value ? $fetch<CounterDetailedStats>(url, { query: { ...query, ...range.value } }) : Promise.resolve(null),
    { server: false, lazy: true },
  );
}

export function selectProfile(
  period: StatsPeriod,
  recent: CounterProfile | null | undefined,
  yearly: YearlyStats[] | null | undefined,
  range: CounterProfile | null | undefined,
): CounterProfile | null | undefined {
  if (period === 'recent') {
    return recent;
  }

  if (typeof period === 'number') {
    return yearly?.find((stats) => stats.year === period);
  }

  return range;
}

export function statsPeriodLabel(
  period: StatsPeriod,
  range: StatsRange | null | undefined,
  currentYear: number | null,
): string {
  if (typeof period === 'number') {
    return `Année ${period}${period === currentYear ? ' (en cours)' : ''}`;
  }

  return range ? `Du ${formatDay(range.from)} au ${formatDay(range.to)}` : '';
}

export type CounterPhoto = { url: string; thumbnail: string };

export async function useCounterPhotos(idPdc: number) {
  const { counterStatsApiUrl } = useRuntimeConfig().public;
  const { data } = await useAsyncData(`counter-photos-${idPdc}`, () =>
    $fetch<CounterPhoto[]>(`${counterStatsApiUrl}/api/counters/${idPdc}/photos`).catch(() => []),
  );
  return computed(() =>
    (data.value ?? []).map((photo) => ({
      url: `${counterStatsApiUrl}${photo.url}`,
      thumbnail: `${counterStatsApiUrl}${photo.thumbnail}`,
    })),
  );
}

export type LiveDay = {
  day: string;
  count: number;
  hours: number;
  hourly: (number | null)[];
  partial: boolean;
};

export function useCounterLiveDays(counter: CounterRef) {
  const { url, query } = counterEndpoint(counter, 'live');
  return useFetch<LiveDay[]>(url, {
    query,
    key: `counter-live-days-${counterKey(counter)}`,
    server: false,
    lazy: true,
  });
}

export type DayHours = { day: string; hourly: (number | null)[]; partial: boolean };
export type SelectedDay = { day: string; color: string };

export function useCounterHours(counter: CounterRef) {
  const { url, query } = counterEndpoint(counter, 'hours');
  return (days: string[]) => $fetch<DayHours[]>(url, { query: { ...query, days: days.join(',') } });
}

export function dayToTimestamp(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

export function formatDay(
  day: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  return new Date(dayToTimestamp(day)).toLocaleDateString('fr-FR', { timeZone: 'UTC', ...options });
}

export function capitalize(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

export function formatPercent(value: number | null | undefined): string {
  return value === null || value === undefined ? '–' : `${Math.round(value)} %`;
}

export function formatCount(count: number): string {
  return Math.round(count).toLocaleString('fr-FR');
}

export function isWeekend(day: string, holidays: Set<string>): boolean {
  const dayOfWeek = new Date(dayToTimestamp(day)).getUTCDay();
  return dayOfWeek === 0 || dayOfWeek === 6 || holidays.has(day);
}
