import { watchEffect, type Ref } from 'vue';
import type { SortOption, ComparisonPeriod } from '~/components/counter/ListLayout.vue';

/**
 * If the latest count is less than 15% of the same month previous year,
 * the counter is likely broken or affected by construction work.
 */
const MAINTENANCE_THRESHOLD = 0.15;

const STABLE_THRESHOLD = 1;

function findSameMonthYearsAgo<T extends { month: string }>(
  entries: T[],
  reference: T,
  yearsAgo: number,
): T | undefined {
  const refMonth = new Date(reference.month).getMonth();
  const refYear = new Date(reference.month).getFullYear();

  return entries.find((entry) => {
    const d = new Date(entry.month);
    return d.getMonth() === refMonth && d.getFullYear() === refYear - yearsAgo;
  });
}

function findSameMonthPreviousYear<T extends { month: string }>(entries: T[], reference: T): T | undefined {
  return findSameMonthYearsAgo(entries, reference, 1);
}

function findCountForMonth<T extends { month: string }>(entries: T[], monthIso: string): T | undefined {
  return entries.find((entry) => entry.month === monthIso);
}

function daysInMonthOf(monthIso: string): number {
  const d = new Date(monthIso);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function aggregateMatchedYears<T extends { month: string }>(
  entries: T[],
  year: number,
  refYear: number,
  accessor: (entry: T) => number = (entry) => (entry as T & { count: number }).count,
): { currentTotal: number; currentDays: number; referenceTotal: number; referenceDays: number; matchedMonths: number } {
  const yearMonths = new Map<number, T>();
  const refMonths = new Map<number, T>();

  for (const e of entries) {
    const d = new Date(e.month);
    const m = d.getMonth();
    const y = d.getFullYear();
    if (y === year) yearMonths.set(m, e);
    else if (y === refYear) refMonths.set(m, e);
  }

  let currentTotal = 0;
  let currentDays = 0;
  let referenceTotal = 0;
  let referenceDays = 0;
  let matchedMonths = 0;

  for (const [m, cur] of yearMonths.entries()) {
    const ref = refMonths.get(m);
    if (!ref) {
      continue;
    }

    matchedMonths++;
    currentTotal += accessor(cur);
    currentDays += daysInMonthOf(cur.month);
    referenceTotal += accessor(ref);
    referenceDays += daysInMonthOf(ref.month);
  }

  return { currentTotal, currentDays, referenceTotal, referenceDays, matchedMonths };
}

export function useCounterUtils() {
  function isCountInMaintenance(current: number | undefined, previousYear: number | undefined): boolean {
    if (current === undefined) {
      return false;
    }

    if (current === 0) {
      return true;
    }

    if (previousYear === undefined || previousYear === 0) {
      return false;
    }

    return current < previousYear * MAINTENANCE_THRESHOLD;
  }

  function isCountsInMaintenance(counts: { month: string; count: number }[]): boolean {
    if (counts.length < 13) {
      return false;
    }

    const last = counts.at(-1);
    if (!last) {
      return false;
    }

    if (last.count === 0) {
      return true;
    }

    const prevYear = findSameMonthPreviousYear(counts, last);

    if (!prevYear || prevYear.count === 0) {
      return false;
    }

    return last.count < prevYear.count * MAINTENANCE_THRESHOLD;
  }

  function computeEvolution(count1: number | undefined, count2: number | undefined): number | null {
    if (count1 === undefined || count1 === 0) {
      return null;
    }

    if (count2 === undefined) {
      return null;
    }

    return Math.round(((count2 - count1) / count1) * 1000) / 10;
  }

  function isStableEvolution(evolution: number | null): boolean {
    return evolution !== null && Math.abs(evolution) < STABLE_THRESHOLD;
  }

  function getEvolutionForMonth<T extends { month: string }>(
    counts: T[],
    monthIso: string,
    yearsAgo: number,
    countAccessor: (entry: T) => number = (entry) => (entry as T & { count: number }).count,
  ): number | null {
    const ref = findCountForMonth(counts, monthIso);
    if (!ref) {
      return null;
    }

    const prev = findSameMonthYearsAgo(counts, ref, yearsAgo);
    return computeEvolution(prev ? countAccessor(prev) : undefined, countAccessor(ref));
  }

  function getEvolutionForYear<T extends { month: string }>(
    counts: T[],
    year: number,
    yearsAgo: number,
    countAccessor: (entry: T) => number = (entry) => (entry as T & { count: number }).count,
  ): number | null {
    const agg = aggregateMatchedYears(counts, year, year - yearsAgo, countAccessor);
    if (agg.matchedMonths === 0) {
      return null;
    }

    return computeEvolution(agg.referenceTotal, agg.currentTotal);
  }

  const MIN_YEAR = 2018;
  function getAvailableMonths<T extends { counts: C[] }, C extends { month: string }>(
    counters: T[] | null | undefined,
    countAccessor: (c: C) => number = (c) => (c as C & { count: number }).count,
  ): string[] {
    if (!counters) {
      return [];
    }

    const months = new Set<string>();
    for (const counter of counters) {
      for (const c of counter.counts) {
        if (countAccessor(c) > 0 && +(c.month?.split('-')[0] ?? 0) > MIN_YEAR) {
          months.add(c.month);
        }
      }
    }

    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }

  function getAvailableYears(availableMonths: string[]): number[] {
    const years = new Set<number>();
    for (const m of availableMonths) {
      years.add(+(m?.split('-')[0] ?? 0));
    }
    return Array.from(years).sort((a, b) => b - a);
  }

  function syncDefaultPeriod(
    selectedMonth: Ref<string>,
    availableMonths: Ref<string[]>,
    selectedYear: Ref<number>,
    availableYears: Ref<number[]>,
  ) {
    watchEffect(() => {
      if (!selectedMonth.value && availableMonths.value.length > 0) {
        selectedMonth.value = availableMonths.value[0]!;
      }
      if (!selectedYear.value && availableYears.value.length > 0) {
        selectedYear.value = availableYears.value[0]!;
      }
    });
  }

  function sortCounters<T extends { counts: C[] }, C extends { month: string }>(
    counters: T[],
    sortBy: Ref<SortOption>,
    comparisonPeriod: Ref<ComparisonPeriod>,
    selectedMonth: Ref<string>,
    selectedYear: Ref<number>,
    referenceYearOffset: Ref<number>,
    countAccessor: (entry: C) => number = (entry) => (entry as C & { count: number }).count,
  ): T[] {
    return [...counters].sort((a, b) => {
      if (sortBy.value === 'evolution') {
        if (comparisonPeriod.value === 'annual') {
          return (
            (getEvolutionForYear(b.counts, selectedYear.value, referenceYearOffset.value, countAccessor) ?? -Infinity) -
            (getEvolutionForYear(a.counts, selectedYear.value, referenceYearOffset.value, countAccessor) ?? -Infinity)
          );
        }
        return (
          (getEvolutionForMonth(b.counts, selectedMonth.value, referenceYearOffset.value, countAccessor) ?? -Infinity) -
          (getEvolutionForMonth(a.counts, selectedMonth.value, referenceYearOffset.value, countAccessor) ?? -Infinity)
        );
      }
      if (comparisonPeriod.value === 'annual') {
        return (
          aggregateMatchedYears(
            b.counts,
            selectedYear.value,
            selectedYear.value - referenceYearOffset.value,
            countAccessor,
          ).currentTotal -
          aggregateMatchedYears(
            a.counts,
            selectedYear.value,
            selectedYear.value - referenceYearOffset.value,
            countAccessor,
          ).currentTotal
        );
      }
      return (
        (findCountForMonth(b.counts, selectedMonth.value)
          ? countAccessor(findCountForMonth(b.counts, selectedMonth.value)!)
          : 0) -
        (findCountForMonth(a.counts, selectedMonth.value)
          ? countAccessor(findCountForMonth(a.counts, selectedMonth.value)!)
          : 0)
      );
    });
  }

  return {
    findSameMonthYearsAgo,
    findCountForMonth,
    aggregateMatchedYears,
    isCountInMaintenance,
    isCountsInMaintenance,
    computeEvolution,
    isStableEvolution,
    getAvailableMonths,
    getAvailableYears,
    syncDefaultPeriod,
    sortCounters,
  };
}
