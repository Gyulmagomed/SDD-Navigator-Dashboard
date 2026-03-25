"use client";

import { useQueries } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getCoverageBySpec } from "@/lib/api/endpoints";
import { coverageQueryKey, useSpecs } from "@/lib/api/hooks";
import type { MatrixCellValue } from "@/lib/utils/csv";
import { coverageMatrixToCsv, downloadTextFile } from "@/lib/utils/csv";
import { cn } from "@/lib/utils";
import type { CoverageMetric, CoverageStatus, Specification } from "@/types";

const MATRIX_PAGE_SIZE = 48;
const STALE_MS = 5 * 60 * 1000;

type CoverageFilterMode = "all" | "critical" | "full";

function statusLabel(status: CoverageStatus): string {
  switch (status) {
    case "covered":
      return "Covered";
    case "partial":
      return "Partial";
    default:
      return "Not covered";
  }
}

function cellBackground(percent: number | null): string {
  if (percent === null) {
    return "bg-muted";
  }
  if (percent < 50) {
    return "bg-red-500/85 hover:bg-red-500";
  }
  if (percent < 80) {
    return "bg-amber-400/85 hover:bg-amber-400";
  }
  return "bg-green-600/85 hover:bg-green-600";
}

function specMatchesFilter(
  spec: Specification,
  metrics: CoverageMetric[] | undefined,
  mode: CoverageFilterMode,
): boolean {
  if (mode === "all") {
    return true;
  }
  if (mode === "full") {
    return spec.coveragePercent === 100;
  }
  if (spec.coveragePercent < 50) {
    return true;
  }
  if (!metrics) {
    return false;
  }
  return metrics.some((metric) => metric.percent < 50);
}

function metricForSection(metrics: CoverageMetric[] | undefined, section: string): CoverageMetric | undefined {
  return metrics?.find((metric) => metric.section === section);
}

interface DrillSelection {
  spec: Specification;
  metric: CoverageMetric;
}

export function CoverageMap(): ReactElement {
  const [filterMode, setFilterMode] = useState<CoverageFilterMode>("all");
  const [drill, setDrill] = useState<DrillSelection | null>(null);

  const specsQuery = useSpecs({
    page: 1,
    pageSize: MATRIX_PAGE_SIZE,
    sortBy: "name",
    sortOrder: "asc",
  });

  const specs = useMemo(
    () => specsQuery.data?.data ?? [],
    [specsQuery.data?.data],
  );

  const specIndexById = useMemo(() => {
    const map = new Map<string, number>();
    specs.forEach((spec, index) => map.set(spec.id, index));
    return map;
  }, [specs]);

  const coverageQueries = useQueries({
    queries: specs.map((spec) => ({
      queryKey: coverageQueryKey(spec.id),
      queryFn: () => getCoverageBySpec(spec.id),
      enabled: specs.length > 0,
      staleTime: STALE_MS,
      gcTime: 30 * 60 * 1000,
    })),
  });

  const coverageBySpecId = useMemo(() => {
    const map = new Map<string, CoverageMetric[]>();
    specs.forEach((spec, index) => {
      const list = coverageQueries[index]?.data?.data;
      if (list) {
        map.set(spec.id, list);
      }
    });
    return map;
  }, [specs, coverageQueries]);

  const allSections = useMemo(() => {
    const set = new Set<string>();
    coverageBySpecId.forEach((metrics) => {
      metrics.forEach((metric) => set.add(metric.section));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [coverageBySpecId]);

  const filteredSpecs = useMemo(
    () =>
      specs.filter((spec) =>
        specMatchesFilter(spec, coverageBySpecId.get(spec.id), filterMode),
      ),
    [specs, coverageBySpecId, filterMode],
  );

  const getCellValue = (specId: string, section: string): MatrixCellValue | null => {
    const metrics = coverageBySpecId.get(specId);
    const metric = metricForSection(metrics, section);
    if (!metric) {
      return null;
    }
    return { percent: metric.percent, itemCount: metric.items.length };
  };

  const exportMatrix = (): void => {
    const csv = coverageMatrixToCsv(filteredSpecs, allSections, getCellValue);
    downloadTextFile(`coverage-matrix-${Date.now()}.csv`, csv, "text/csv;charset=utf-8");
  };

  const anyCoverageLoading = coverageQueries.some((query, index) => {
    return specs[index] !== undefined && query.isPending;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Coverage map</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Matrix of specification rows and section columns. Up to {MATRIX_PAGE_SIZE} specs loaded;
            click a cell for section items.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex rounded-lg border p-0.5"
            role="group"
            aria-label="Coverage filter"
          >
            {(
              [
                ["all", "All"],
                ["critical", "Critical (<50%)"],
                ["full", "Full (100%)"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterMode(value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  filterMode === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={exportMatrix} disabled={filteredSpecs.length === 0}>
            Download CSV
          </Button>
        </div>
      </header>

      {specsQuery.isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {specsQuery.error instanceof Error
            ? specsQuery.error.message
            : "Failed to load specifications."}
        </p>
      ) : null}

      <div className="relative overflow-x-auto rounded-xl border bg-card shadow-sm [-webkit-overflow-scrolling:touch]">
        {specsQuery.isLoading ? (
          <div className="h-64 animate-pulse bg-muted/40" />
        ) : (
          <div className="max-h-[min(70vh,720px)] overflow-y-auto">
            <table className="w-max min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky top-0 left-0 z-30 min-w-[180px] border-b border-r bg-card px-3 py-2 text-left font-semibold shadow-[inset_0_-1px_0_hsl(var(--border))]"
                  >
                    Specification
                  </th>
                  {allSections.map((section) => (
                    <th
                      key={section}
                      scope="col"
                      className="sticky top-0 z-20 min-w-[52px] border-b bg-card px-1 py-2 text-center text-xs font-medium text-muted-foreground"
                      title={section}
                    >
                      <span className="line-clamp-2 max-w-[4.5rem]">{section}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSpecs.map((spec) => (
                  <tr key={spec.id} className="border-b last:border-0">
                    <th
                      scope="row"
                      className="sticky left-0 z-20 whitespace-nowrap border-r bg-card px-3 py-2 text-left font-medium shadow-[2px_0_4px_rgba(0,0,0,0.06)]"
                    >
                      <span className="line-clamp-2 max-w-[220px]" title={spec.name}>
                        {spec.name}
                      </span>
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground tabular-nums">
                        {spec.coveragePercent}% overall
                      </span>
                    </th>
                    {allSections.map((section) => {
                      const metrics = coverageBySpecId.get(spec.id);
                      const metric = metricForSection(metrics, section);
                      const percent = metric !== undefined ? metric.percent : null;
                      const coverageIndex = specIndexById.get(spec.id) ?? 0;
                      const coverageLoading = coverageQueries[coverageIndex]?.isPending;
                      return (
                        <td key={section} className="p-0.5 align-middle">
                          <button
                            type="button"
                            disabled={metric === undefined}
                            onClick={() => {
                              if (metric) {
                                setDrill({ spec, metric });
                              }
                            }}
                            className={cn(
                              "flex h-11 w-full min-w-[48px] items-center justify-center rounded-md text-xs font-semibold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                              coverageLoading && percent === null ? "animate-pulse bg-muted" : cellBackground(percent),
                            )}
                            title={
                              metric
                                ? `${section}: ${String(metric.percent)}%, ${String(metric.items.length)} items — click to drill down`
                                : section
                            }
                            aria-label={
                              metric
                                ? `Open ${section} for ${spec.name}, ${String(metric.percent)} percent coverage`
                                : `No data for ${section}`
                            }
                          >
                            {metric ? `${Math.round(metric.percent)}` : coverageLoading ? "·" : "—"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {anyCoverageLoading ? (
          <p className="border-t px-3 py-2 text-xs text-muted-foreground">Loading section data…</p>
        ) : null}
        {!specsQuery.isLoading && filteredSpecs.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No specifications match this filter.
          </p>
        ) : null}
      </div>

      <Sheet
        open={drill !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDrill(null);
          }
        }}
      >
        <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
          {drill ? (
            <>
              <SheetHeader>
                <SheetTitle>{drill.metric.section}</SheetTitle>
                <SheetDescription>
                  {drill.spec.name} · {Math.round(drill.metric.percent)}% · {drill.metric.items.length} items
                </SheetDescription>
              </SheetHeader>
              <ul className="mt-4 space-y-2 px-4">
                {drill.metric.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-2 rounded-md border bg-background px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {item.linkedComponents.length > 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.linkedComponents.join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {statusLabel(item.status)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
