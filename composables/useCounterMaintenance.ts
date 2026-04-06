/**
 * If the latest count is less than 15% of the same month previous year,
 * the counter is likely broken or affected by construction work.
 */
const MAINTENANCE_THRESHOLD = 0.15;

const STABLE_THRESHOLD = 1;

export function useCounterMaintenance() {
  function isCountInMaintenance(current: number | undefined, previousYear: number | undefined): boolean {
    if (previousYear === undefined || previousYear === 0) return false;
    if (current === undefined) return false;
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

    const lastMonth = new Date(last.month).getMonth();
    const lastYear = new Date(last.month).getFullYear();
    const prevYear = counts.find((c) => {
      const d = new Date(c.month);
      return d.getMonth() === lastMonth && d.getFullYear() === lastYear - 1;
    });

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

  return {
    isCountInMaintenance,
    isCountsInMaintenance,
    computeEvolution,
    isStableEvolution,
  };
}
