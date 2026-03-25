"use client";

import type { ReactElement } from "react";
import { Suspense, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { useDashboardStats, useSpecs } from "@/lib/api/hooks";
import { useFilterStore } from "@/lib/store/filterStore";
import { useUiStore } from "@/lib/store/uiStore";
import { countFullyCovered } from "@/lib/utils/dashboard";
import type { Specification } from "@/types";

const CoverageTrendChart = dynamic(
  () => import("@/components/dashboard/coverage-trend-chart").then((mod) => mod.CoverageTrendChart),
);
const TopBottomSpecs = dynamic(
  () => import("@/components/dashboard/top-bottom-specs").then((mod) => mod.TopBottomSpecs),
);
const CoverageDistribution = dynamic(
  () =>
    import("@/components/dashboard/coverage-distribution").then(
      (mod) => mod.CoverageDistribution,
    ),
);

function splitTopBottom(specs: Specification[]): {
  top: Specification[];
  bottom: Specification[];
} {
  const n = specs.length;
  if (n === 0) {
    return { top: [], bottom: [] };
  }
  const sortedDesc = [...specs].sort((a, b) => b.coveragePercent - a.coveragePercent);
  const sortedAsc = [...specs].sort((a, b) => a.coveragePercent - b.coveragePercent);
  const limit = Math.min(5, n);
  return {
    top: sortedDesc.slice(0, limit),
    bottom: sortedAsc.slice(0, limit),
  };
}

export function OverviewDashboard(): ReactElement {
  const dashboardFilters = useFilterStore((state) => state.dashboardFilters);
  const setDashboardFilters = useFilterStore((state) => state.setDashboardFilters);
  const resetDashboardFilters = useFilterStore((state) => state.resetDashboardFilters);
  const setUiActiveFilters = useUiStore((state) => state.setActiveFilters);
  const clearUiActiveFilters = useUiStore((state) => state.clearActiveFilters);

  const statsQuery = useDashboardStats();
  const specsQuery = useSpecs({
    sortBy: "coveragePercent",
    sortOrder: "desc",
    page: 1,
    pageSize: 200,
    ...dashboardFilters,
  });

  const sortedSpecs = useMemo(
    () => specsQuery.data?.data ?? [],
    [specsQuery.data?.data],
  );
  const { top, bottom } = useMemo(() => splitTopBottom(sortedSpecs), [sortedSpecs]);
  const fullyCoveredFromList =
    statsQuery.data?.data.fullyCoveredSpecs === undefined
      ? countFullyCovered(sortedSpecs)
      : undefined;

  useEffect(() => {
    if (!statsQuery.isError) {
      return;
    }
    toast.error(
      statsQuery.error instanceof Error
        ? statsQuery.error.message
        : "Dashboard stats request failed.",
    );
  }, [statsQuery.isError, statsQuery.error]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          SDD coverage snapshot, trends, and specification ranking.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
        <span className="text-muted-foreground">Quick filters (store + list):</span>
        {(["active", "draft", "archived"] as const).map((status) => (
          <button
            key={status}
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              dashboardFilters.status === status
                ? "border-primary bg-primary text-primary-foreground"
                : "border-transparent bg-muted hover:bg-muted/80"
            }`}
            onClick={() => {
              setDashboardFilters({ status });
              setUiActiveFilters({ status });
            }}
          >
            {status}
          </button>
        ))}
        <button
          type="button"
          className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
          onClick={() => {
            resetDashboardFilters();
            clearUiActiveFilters();
          }}
        >
          Clear
        </button>
      </div>

      <KpiCards
        stats={statsQuery.data?.data}
        isLoading={statsQuery.isLoading}
        fullyCoveredFromList={fullyCoveredFromList}
      />

      {statsQuery.isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {statsQuery.error instanceof Error
            ? statsQuery.error.message
            : "Failed to load dashboard stats."}
        </p>
      ) : null}

      <Suspense fallback={<div className="h-[320px] animate-pulse rounded-xl bg-muted" />}>
        <CoverageTrendChart trend={statsQuery.data?.data.trend} isLoading={statsQuery.isLoading} />
      </Suspense>

      {specsQuery.isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {specsQuery.error instanceof Error
            ? specsQuery.error.message
            : "Failed to load specifications list."}
        </p>
      ) : null}

      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
        <TopBottomSpecs top={top} bottom={bottom} isLoading={specsQuery.isLoading} />
      </Suspense>

      <Suspense fallback={<div className="h-[280px] animate-pulse rounded-xl bg-muted" />}>
        <CoverageDistribution specs={sortedSpecs} isLoading={specsQuery.isLoading} />
      </Suspense>
    </div>
  );
}
