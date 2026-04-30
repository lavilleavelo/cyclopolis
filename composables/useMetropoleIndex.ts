import type { Collections } from '@nuxt/content';

export const REFERENCE_YEAR = 2019;
export const MIN_MATCHED_MONTHS_PER_YEAR = 6;

type Counter = Collections['compteurs'];

export type IndexResult = {
  years: number[];
  lastYear: number;
  counterCount: number;
  indices: (number | null)[];
};

export type CounterStatus =
  | { state: 'retained'; availabilityPct: number }
  | { state: 'no-2019'; availabilityPct: number }
  | { state: 'insufficient'; availabilityPct: number };

export type CounterPerYearDetail = {
  matchedMonths: number;
  yearMonthsAvailable: number;
  yearTotal: number;
  yoyDelta: number | null;
  vsBaselineDelta: number | null;
};

export type PerCounterRow = {
  name: string;
  path?: string;
  arrondissement?: string;
  status: CounterStatus;
  perYear: (CounterPerYearDetail | null)[];
  yearlyTotals: number[];
  totalGrowth: number | null;
  monthly: { month: string; count: number }[];
};

function parseYear(monthStr: string): number {
  return Number(monthStr.slice(0, 4));
}

function parseMonth(monthStr: string): number {
  return Number(monthStr.slice(5, 7)) - 1;
}

function computeLastYear(counters: Counter[]): number {
  let max = REFERENCE_YEAR;
  for (const counter of counters) {
    for (const c of counter.counts) {
      const y = parseYear(c.month);
      if (y > max) {
        max = y;
      }
    }
  }

  const now = new Date();
  const lastComplete = now.getMonth() === 11 ? now.getFullYear() : now.getFullYear() - 1;

  return Math.min(max, lastComplete);
}

export function useMetropoleIndex() {
  function computeIndex(counters: Counter[], options: { aggregation?: 'aggregate' | 'average' } = {}): IndexResult {
    const aggregation = options.aggregation ?? 'aggregate';
    const lastYear = computeLastYear(counters);
    const years: number[] = [];
    for (let y = REFERENCE_YEAR; y <= lastYear; y++) {
      years.push(y);
    }

    if (years.length === 0) {
      return { years, lastYear, counterCount: 0, indices: [] };
    }

    const perCounterMonthly = counters
      .map((counter) => {
        const map = new Map<number, Map<number, number>>();
        let has2019 = false;
        for (const c of counter.counts) {
          const y = parseYear(c.month);
          const m = parseMonth(c.month);
          if (y < REFERENCE_YEAR || y > lastYear) {
            continue;
          }

          if (!map.has(y)) {
            map.set(y, new Map());
          }

          map.get(y)!.set(m, c.count);
          if (y === REFERENCE_YEAR) {
            has2019 = true;
          }
        }
        return has2019 ? map : null;
      })
      .filter((m): m is Map<number, Map<number, number>> => m !== null);

    const matchedSums = perCounterMonthly.map((counterMap) => {
      const baseMonths = counterMap.get(REFERENCE_YEAR);
      return years.map((y) => {
        const yMonths = counterMap.get(y);
        if (!baseMonths || !yMonths) {
          return null;
        }

        let yearSum = 0;
        let baselineSum = 0;
        let matchedMonths = 0;
        for (let m = 0; m < 12; m++) {
          const baseVal = baseMonths.get(m) ?? 0;
          const yVal = yMonths.get(m) ?? 0;
          if (baseVal > 0 && yVal > 0) {
            yearSum += yVal;
            baselineSum += baseVal;
            matchedMonths++;
          }
        }

        if (baselineSum === 0 || matchedMonths < MIN_MATCHED_MONTHS_PER_YEAR) {
          return null;
        }

        return { yearSum, baselineSum };
      });
    });

    let indices: (number | null)[];
    const contributingCounters = new Set<number>();

    if (aggregation === 'aggregate') {
      indices = years.map((_, idx) => {
        let num = 0;
        let den = 0;
        matchedSums.forEach((row, rowIndex) => {
          const cell = row[idx];
          if (cell) {
            num += cell.yearSum;
            den += cell.baselineSum;
            contributingCounters.add(rowIndex);
          }
        });
        return den === 0 ? null : (num / den) * 100;
      });
    } else {
      indices = years.map((_, idx) => {
        const ratios: number[] = [];
        matchedSums.forEach((row, rowIndex) => {
          const cell = row[idx];
          if (cell) {
            ratios.push((cell.yearSum / cell.baselineSum) * 100);
            contributingCounters.add(rowIndex);
          }
        });
        if (ratios.length === 0) {
          return null;
        }

        return ratios.reduce((s, r) => s + r, 0) / ratios.length;
      });
    }

    return { years, lastYear, counterCount: contributingCounters.size, indices };
  }

  function yoyDelta(indices: (number | null)[], idx: number): number | null {
    if (idx === 0) {
      return null;
    }

    const current = indices[idx];
    const previous = indices[idx - 1];
    if (current == null || previous == null || previous === 0) {
      return null;
    }

    return ((current - previous) / previous) * 100;
  }

  function computeCounterDetails(counters: Counter[]): { years: number[]; lastYear: number; rows: PerCounterRow[] } {
    const lastYear = computeLastYear(counters);
    const years: number[] = [];

    for (let y = REFERENCE_YEAR; y <= lastYear; y++) {
      years.push(y);
    }

    if (years.length === 0)
      return {
        years,
        lastYear,
        rows: [],
      };

    const totalMonths = years.length * 12;

    const rows: PerCounterRow[] = counters.map((counter) => {
      let available = 0;
      let referenceYearTotal = 0;

      const monthly = new Map<number, Map<number, number>>();
      for (const c of counter.counts) {
        const y = parseYear(c.month);
        const m = parseMonth(c.month);
        if (y < REFERENCE_YEAR || y > lastYear) {
          continue;
        }

        if (c.count > 0) {
          available++;
        }

        if (y === REFERENCE_YEAR) {
          referenceYearTotal += c.count;
        }

        if (!monthly.has(y)) {
          monthly.set(y, new Map());
        }

        monthly.get(y)!.set(m, c.count);
      }

      const availabilityPct = totalMonths === 0 ? 0 : (available / totalMonths) * 100;

      const baseMonths = monthly.get(REFERENCE_YEAR);
      let hasAnyValidYear = false;
      const perYear = years.map((y, yIdx) => {
        const yMonths = monthly.get(y);
        if (!yMonths) {
          return null;
        }

        // Stats vs 2019
        let matchedMonths = 0;
        let yearMonthsAvailable = 0;
        let yearTotal = 0;
        let baselineSumMatched = 0;
        let yearSumMatched = 0;
        for (let m = 0; m < 12; m++) {
          const yVal = yMonths.get(m) ?? 0;
          if (yVal > 0) yearMonthsAvailable++;
          yearTotal += yVal;
          const baseVal = baseMonths?.get(m) ?? 0;
          if (baseVal > 0 && yVal > 0) {
            matchedMonths++;
            baselineSumMatched += baseVal;
            yearSumMatched += yVal;
          }
        }

        let vsBaselineDelta: number | null = null;
        if (matchedMonths >= MIN_MATCHED_MONTHS_PER_YEAR && baselineSumMatched > 0) {
          vsBaselineDelta = ((yearSumMatched - baselineSumMatched) / baselineSumMatched) * 100;
        }

        // Stats vs Previous Year
        let yoyDelta: number | null = null;
        if (yIdx > 0) {
          const prevY = years[yIdx - 1];
          const prevMonths = monthly.get(prevY);
          if (prevMonths) {
            let prevSumMatched = 0;
            let currSumMatched = 0;
            let matchedPrev = 0;
            for (let m = 0; m < 12; m++) {
              const prevVal = prevMonths.get(m) ?? 0;
              const currVal = yMonths.get(m) ?? 0;
              if (prevVal > 0 && currVal > 0) {
                matchedPrev++;
                prevSumMatched += prevVal;
                currSumMatched += currVal;
              }
            }
            if (matchedPrev >= MIN_MATCHED_MONTHS_PER_YEAR && prevSumMatched > 0) {
              yoyDelta = ((currSumMatched - prevSumMatched) / prevSumMatched) * 100;
            }
          }
        }

        if (y > REFERENCE_YEAR && matchedMonths >= MIN_MATCHED_MONTHS_PER_YEAR) {
          hasAnyValidYear = true;
        }

        return { matchedMonths, yearMonthsAvailable, yearTotal, yoyDelta, vsBaselineDelta };
      });

      let status: CounterStatus;
      if (referenceYearTotal === 0) {
        status = { state: 'no-2019', availabilityPct };
      } else if (!hasAnyValidYear) {
        status = { state: 'insufficient', availabilityPct };
      } else {
        status = { state: 'retained', availabilityPct };
      }

      const yearlyTotals = perYear.map((py) => py?.yearTotal ?? 0);

      let totalGrowth: number | null = null;
      for (let i = perYear.length - 1; i >= 0; i--) {
        const py = perYear[i];
        if (py && py.vsBaselineDelta !== null) {
          totalGrowth = py.vsBaselineDelta;
          break;
        }
      }

      const monthlyData = counter.counts
        .filter((c) => {
          const y = parseYear(c.month);
          return y >= REFERENCE_YEAR && y <= lastYear;
        })
        .map((c) => ({ month: c.month, count: c.count }));

      return {
        name: counter.name,
        path: 'path' in counter ? (counter.path as string) : undefined,
        arrondissement: 'arrondissement' in counter ? (counter.arrondissement as string) : undefined,
        status,
        perYear,
        yearlyTotals,
        totalGrowth,
        monthly: monthlyData,
      };
    });

    function totalPassages(row: PerCounterRow): number {
      let s = 0;
      for (const y of row.yearlyTotals) {
        s += y;
      }

      return s;
    }

    rows.sort((a, b) => {
      const order = { retained: 0, insufficient: 1, 'no-2019': 2 } as const;
      const oa = order[a.status.state];
      const ob = order[b.status.state];
      if (oa !== ob) {
        return oa - ob;
      }

      if (a.status.state === 'retained') {
        return totalPassages(b) - totalPassages(a);
      }

      return b.status.availabilityPct - a.status.availabilityPct;
    });

    return { years, lastYear, rows };
  }

  return {
    computeIndex,
    computeCounterDetails,
    yoyDelta,
    REFERENCE_YEAR,
    MIN_MATCHED_MONTHS_PER_YEAR,
  };
}
