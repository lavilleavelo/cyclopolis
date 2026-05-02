import type { Count } from '~/types';

const MAX_GROWTH_YEARS = 6;

export type CounterStats = {
  totalSinceStart: number;
  firstMonthLabel: string;
  latestMonthLabel: string;
  latestMonthDailyAverage: number;
  latestMonthCount: number;
  twelveMonthAverageDaily: number;
  bestMonthLabel: string;
  bestMonthDailyAverage: number;
  growthYears: number;
  growthPercent: number | null;
  growthFromYear: number | null;
  growthToYear: number | null;
  growthRecentTotal: number | null;
  growthRefTotal: number | null;
  growthRecentRangeLabel: string | null;
  growthRefRangeLabel: string | null;
  unitLabel: string;
  summarySentence: string;
};

function daysInMonthOf(monthIso: string): number {
  const d = new Date(monthIso);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function formatMonthLabel(monthIso: string): string {
  const d = new Date(monthIso);
  const label = d.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('fr-FR');
}

export function buildCounterStats(counts: Count[], unitLabel = 'passages'): CounterStats {
  if (counts.length === 0) {
    return {
      totalSinceStart: 0,
      firstMonthLabel: '',
      latestMonthLabel: '',
      latestMonthDailyAverage: 0,
      latestMonthCount: 0,
      twelveMonthAverageDaily: 0,
      bestMonthLabel: '',
      bestMonthDailyAverage: 0,
      growthYears: 0,
      growthPercent: null,
      growthFromYear: null,
      growthToYear: null,
      growthRecentTotal: null,
      growthRefTotal: null,
      growthRecentRangeLabel: null,
      growthRefRangeLabel: null,
      unitLabel,
      summarySentence: '',
    };
  }

  const sorted = counts.slice().sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  const totalSinceStart = sorted.reduce((acc, c) => acc + c.count, 0);
  const firstMonth = sorted[0]!;
  const latestMonth = sorted[sorted.length - 1]!;
  const latestMonthDailyAverage = latestMonth.count / daysInMonthOf(latestMonth.month);

  const last12 = sorted.slice(-12);
  const last12Total = last12.reduce((acc, c) => acc + c.count, 0);
  const last12Days = last12.reduce((acc, c) => acc + daysInMonthOf(c.month), 0);
  const twelveMonthAverageDaily = last12Days > 0 ? last12Total / last12Days : 0;

  const dailyAverages = sorted.map((c) => ({
    iso: c.month,
    daily: c.count / daysInMonthOf(c.month),
  }));
  const best = dailyAverages.reduce((acc, cur) => (cur.daily > acc.daily ? cur : acc), dailyAverages[0]!);

  const growth = computeGrowth(sorted);

  const summaryParts = [
    `En moyenne ${formatNumber(twelveMonthAverageDaily)} ${unitLabel} par jour sur les 12 derniers mois (depuis ${formatMonthLabel(firstMonth.month)}).`,
  ];

  if (growth.growthPercent !== null && growth.growthFromYear !== null && growth.growthToYear !== null) {
    const sign = growth.growthPercent >= 0 ? '+' : '';
    summaryParts.push(
      `Évolution ${growth.growthFromYear} → ${growth.growthToYear}\u00a0: ${sign}${growth.growthPercent.toFixed(1)}\u00a0%.`,
    );
  }

  const summarySentence = summaryParts.join(' ');

  return {
    totalSinceStart,
    firstMonthLabel: formatMonthLabel(firstMonth.month),
    latestMonthLabel: formatMonthLabel(latestMonth.month),
    latestMonthDailyAverage,
    latestMonthCount: latestMonth.count,
    twelveMonthAverageDaily,
    bestMonthLabel: formatMonthLabel(best.iso),
    bestMonthDailyAverage: best.daily,
    growthYears: growth.growthYears,
    growthPercent: growth.growthPercent,
    growthFromYear: growth.growthFromYear,
    growthToYear: growth.growthToYear,
    growthRecentTotal: growth.growthRecentTotal,
    growthRefTotal: growth.growthRefTotal,
    growthRecentRangeLabel: growth.growthRecentRangeLabel,
    growthRefRangeLabel: growth.growthRefRangeLabel,
    unitLabel,
    summarySentence,
  };
}

function monthIndexOf(monthIso: string): number {
  const d = new Date(monthIso);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}

function totalForWindow(
  sortedCounts: Count[],
  startMonthIdx: number,
  endMonthIdx: number,
): { total: number; matched: number } {
  let total = 0;
  let matched = 0;

  for (const c of sortedCounts) {
    const idx = monthIndexOf(c.month);
    if (idx >= startMonthIdx && idx <= endMonthIdx) {
      total += c.count;
      matched += 1;
    }
  }

  return { total, matched };
}

function emptyGrowth() {
  return {
    growthYears: 0,
    growthPercent: null,
    growthFromYear: null,
    growthToYear: null,
    growthRecentTotal: null,
    growthRefTotal: null,
    growthRecentRangeLabel: null,
    growthRefRangeLabel: null,
  };
}

function rangeLabelFromMonthIdx(startIdx: number, endIdx: number): string {
  const startYear = Math.floor(startIdx / 12);
  const startMonth = startIdx % 12;

  const endYear = Math.floor(endIdx / 12);
  const endMonth = endIdx % 12;

  const startIso = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-01`;
  const endIso = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-01`;

  const startLabel = new Date(startIso).toLocaleString('fr-FR', { month: 'short', year: 'numeric' }).replace('.', '');
  const endLabel = new Date(endIso).toLocaleString('fr-FR', { month: 'short', year: 'numeric' }).replace('.', '');

  return `${startLabel} → ${endLabel}`;
}

function computeGrowth(sortedCounts: Count[]): {
  growthYears: number;
  growthPercent: number | null;
  growthFromYear: number | null;
  growthToYear: number | null;
  growthRecentTotal: number | null;
  growthRefTotal: number | null;
  growthRecentRangeLabel: string | null;
  growthRefRangeLabel: string | null;
} {
  if (sortedCounts.length < 13) {
    return emptyGrowth();
  }

  const latest = sortedCounts[sortedCounts.length - 1]!;
  const latestIdx = monthIndexOf(latest.month);
  const latestYear = new Date(latest.month).getUTCFullYear();
  const recentStartIdx = latestIdx - 11;

  const recent = totalForWindow(sortedCounts, recentStartIdx, latestIdx);
  if (recent.matched < 12 || recent.total === 0) {
    return emptyGrowth();
  }

  const firstIdx = monthIndexOf(sortedCounts[0]!.month);

  for (let yearsBack = MAX_GROWTH_YEARS; yearsBack >= 1; yearsBack--) {
    const refStartIdx = recentStartIdx - 12 * yearsBack;
    const refEndIdx = latestIdx - 12 * yearsBack;
    if (refStartIdx < firstIdx) {
      continue;
    }

    const ref = totalForWindow(sortedCounts, refStartIdx, refEndIdx);
    if (ref.matched < 12 || ref.total === 0) {
      continue;
    }

    const growthPercent = ((recent.total - ref.total) / ref.total) * 100;
    return {
      growthYears: yearsBack,
      growthPercent,
      growthFromYear: latestYear - yearsBack,
      growthToYear: latestYear,
      growthRecentTotal: recent.total,
      growthRefTotal: ref.total,
      growthRecentRangeLabel: rangeLabelFromMonthIdx(recentStartIdx, latestIdx),
      growthRefRangeLabel: rangeLabelFromMonthIdx(refStartIdx, refEndIdx),
    };
  }

  return emptyGrowth();
}
