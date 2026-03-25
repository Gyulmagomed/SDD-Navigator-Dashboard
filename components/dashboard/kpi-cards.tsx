"use client";

import type { ReactElement } from "react";
import type { DashboardStats } from "@/types";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { cn } from "@/lib/utils";

function KpiSkeleton(): ReactElement {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-9 w-20 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted" />
    </div>
  );
}

interface KpiCardsProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
  fullyCoveredFromList?: number;
}

function DeltaBadge({ delta }: { delta: number | undefined }): ReactElement | null {
  if (delta === undefined) {
    return <p className="text-sm text-muted-foreground">No week-over-week data</p>;
  }

  const positive = delta >= 0;
  return (
    <p
      className={cn(
        "text-sm font-medium",
        positive ? "text-green-600" : "text-red-600",
      )}
    >
      {positive ? "+" : ""}
      {delta} vs last week
    </p>
  );
}

function CoverageIndicator({ percent }: { percent: number }): ReactElement {
  const color =
    percent >= 80 ? "text-green-600" : percent >= 50 ? "text-amber-600" : "text-red-600";
  return <span className={cn("text-3xl font-semibold tabular-nums", color)}>{percent}%</span>;
}

export function KpiCards({
  stats,
  isLoading,
  fullyCoveredFromList,
}: KpiCardsProps): ReactElement {
  const totalAnimated = useAnimatedNumber(stats?.totalSpecs ?? 0, { enabled: !isLoading && Boolean(stats) });
  const avgAnimated = useAnimatedNumber(stats?.avgCoverage ?? 0, {
    decimals: 1,
    enabled: !isLoading && Boolean(stats),
  });
  const criticalAnimated = useAnimatedNumber(stats?.criticalGaps ?? 0, {
    enabled: !isLoading && Boolean(stats),
  });

  const fullyCovered =
    stats?.fullyCoveredSpecs ?? fullyCoveredFromList ?? 0;
  const fullyAnimated = useAnimatedNumber(fullyCovered, {
    enabled: !isLoading && Boolean(stats),
  });

  if (isLoading && !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <KpiSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        KPI data unavailable. Check API connection.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Total Specifications</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{totalAnimated}</p>
        <div className="mt-2">
          <DeltaBadge delta={stats.totalSpecsDeltaLastWeek} />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Average Coverage</p>
        <div className="mt-2 flex items-baseline gap-2">
          <CoverageIndicator percent={avgAnimated} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Green ≥ 80%, yellow ≥ 50%, red &lt; 50%
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Critical Gaps</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums text-red-600">
          {criticalAnimated}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Specs with coverage &lt; 30%</p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Fully Covered</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums text-green-600">
          {fullyAnimated}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">100% coverage</p>
      </div>
    </div>
  );
}
