/**
 * If the latest count is less than 15% of the same month previous year,
 * the counter is likely broken or affected by construction work.
 */
const MAINTENANCE_THRESHOLD = 0.15;

const STABLE_THRESHOLD = 1;

function findSameMonthPreviousYear<T extends { month: string }>(entries: T[], reference: T): T | undefined {
  const refMonth = new Date(reference.month).getMonth();
  const refYear = new Date(reference.month).getFullYear();

  return entries.find((entry) => {
    const d = new Date(entry.month);
    return d.getMonth() === refMonth && d.getFullYear() === refYear - 1;
  });
}

export function useCounterMaintenance() {
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
    if (count1 === undefined || count1 === 0) return null;
    if (count2 === undefined) return null;
    return Math.round(((count2 - count1) / count1) * 1000) / 10;
  }

  function isStableEvolution(evolution: number | null): boolean {
    return evolution !== null && Math.abs(evolution) < STABLE_THRESHOLD;
  }

  function getLatestEvolution<T extends { month: string }>(
    counts: T[],
    countAccessor: (entry: T) => number = (entry) => (entry as T & { count: number }).count,
  ): number | null {
    if (counts.length < 13) {
      return null;
    }

    const last = counts.at(-1);
    if (!last) {
      return null;
    }

    const prevYear = findSameMonthPreviousYear(counts, last);
    return computeEvolution(prevYear ? countAccessor(prevYear) : undefined, countAccessor(last));
  }

  return {
    findSameMonthPreviousYear,
    isCountInMaintenance,
    isCountsInMaintenance,
    computeEvolution,
    isStableEvolution,
    getLatestEvolution,
  };
}
