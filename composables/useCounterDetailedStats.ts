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
