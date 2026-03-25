import type { Specification, TrendPoint } from "@/types";

export type TrendWindowDays = 30 | 60 | 90;

export function filterTrendByWindow(
  trend: TrendPoint[],
  days: TrendWindowDays,
): TrendPoint[] {
  if (trend.length === 0) {
    return [];
  }

  const sorted = [...trend].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const endMs = new Date(sorted[sorted.length - 1].date).getTime();
  const startMs = endMs - days * 86_400_000;

  return sorted.filter((point) => new Date(point.date).getTime() >= startMs);
}

type DistributionBucket = { range: string; count: number };

export function buildCoverageDistribution(specs: Specification[]): DistributionBucket[] {
  const buckets: DistributionBucket[] = [
    { range: "0–25%", count: 0 },
    { range: "26–50%", count: 0 },
    { range: "51–75%", count: 0 },
    { range: "76–100%", count: 0 },
  ];

  for (const spec of specs) {
    const p = spec.coveragePercent;
    if (p <= 25) {
      buckets[0].count += 1;
    } else if (p <= 50) {
      buckets[1].count += 1;
    } else if (p <= 75) {
      buckets[2].count += 1;
    } else {
      buckets[3].count += 1;
    }
  }

  return buckets;
}

export function countFullyCovered(specs: Specification[]): number {
  return specs.reduce(
    (acc, spec) => acc + (spec.coveragePercent === 100 ? 1 : 0),
    0,
  );
}
