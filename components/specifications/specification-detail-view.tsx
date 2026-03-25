"use client";

import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  Tooltip,
  Treemap,
  type TreemapNode,
} from "recharts";
import { useCoverage, useSpecById } from "@/lib/api/hooks";
import type { CoverageMetric, CoverageStatus } from "@/types";

function statusIcon(status: CoverageStatus): { label: string; symbol: string } {
  switch (status) {
    case "covered":
      return { label: "Covered", symbol: "✓" };
    case "partial":
      return { label: "Partial", symbol: "◐" };
    default:
      return { label: "Not covered", symbol: "○" };
  }
}

function ItemStatusIcon({ status }: { status: CoverageStatus }): ReactElement {
  const { label, symbol } = statusIcon(status);
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-full border text-sm" title={label} aria-label={label}>
      <span aria-hidden="true">{symbol}</span>
    </span>
  );
}

function fillForCoveragePercent(percent: number): string {
  if (percent >= 80) {
    return "#16a34a";
  }
  if (percent >= 50) {
    return "#d97706";
  }
  return "#dc2626";
}

interface TreemapDatum {
  name: string;
  value: number;
  percent: number;
  fill: string;
  children?: TreemapDatum[];
  [key: string]: unknown;
}

function TreemapCell(node: TreemapNode): ReactElement {
  const extended = node as TreemapNode & { percent?: number; fill?: string };
  const fill = typeof extended.fill === "string" ? extended.fill : "#2563eb";
  const showLabel = node.width > 56 && node.height > 28;
  const sub =
    typeof extended.percent === "number" ? `${Math.round(extended.percent)}%` : "";

  return (
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        fill={fill}
        stroke="hsl(var(--border))"
        strokeWidth={1}
        rx={4}
      />
      {showLabel ? (
        <text x={node.x + 6} y={node.y + 18} fontSize={11} fill="#fff" className="pointer-events-none">
          {node.name}
        </text>
      ) : null}
      {showLabel && sub ? (
        <text x={node.x + 6} y={node.y + 32} fontSize={10} fill="#f8fafc" className="pointer-events-none opacity-90">
          {sub}
        </text>
      ) : null}
    </g>
  );
}

function SectionRow({ metric }: { metric: CoverageMetric }): ReactElement {
  return (
    <details className="group rounded-lg border bg-card open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="font-medium">{metric.section}</p>
          <p className="text-xs text-muted-foreground">
            {metric.items.length} items · {Math.round(metric.percent)}% covered
          </p>
        </div>
        <div className="h-2 w-32 max-w-[40%] shrink-0 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${Math.min(100, metric.percent)}%` }}
          />
        </div>
      </summary>
      <ul className="space-y-2 border-t px-4 py-3">
        {metric.items.map((item) => (
          <li key={item.id}>
            <details className="rounded-md border bg-background px-3 py-2">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm [&::-webkit-details-marker]:hidden">
                <ItemStatusIcon status={item.status} />
                <span className="font-medium">{item.title}</span>
              </summary>
              <div className="mt-2 pl-9 text-sm text-muted-foreground">
                <p className="text-foreground">Linked components</p>
                <ul className="mt-1 list-disc pl-4">
                  {item.linkedComponents.length ? (
                    item.linkedComponents.map((component) => <li key={component}>{component}</li>)
                  ) : (
                    <li>None linked</li>
                  )}
                </ul>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </details>
  );
}

function buildTreemapRoot(metrics: CoverageMetric[]): TreemapDatum[] {
  const children: TreemapDatum[] = metrics.map((metric) => ({
    name: metric.section,
    value: Math.max(1, metric.items.length),
    percent: metric.percent,
    fill: fillForCoveragePercent(metric.percent),
  }));
  const total = children.reduce((sum, child) => sum + child.value, 0);
  return [
    {
      name: "Sections",
      value: Math.max(1, total),
      percent: 0,
      fill: "#e5e7eb",
      children,
    },
  ];
}

interface SpecificationDetailViewProps {
  specId: string;
}

export function SpecificationDetailView({ specId }: SpecificationDetailViewProps): ReactElement {
  const [tab, setTab] = useState<"overview" | "coverage" | "history">("overview");
  const specQuery = useSpecById(specId);
  const coverageQuery = useCoverage(specId);

  const spec = specQuery.data?.data;
  const metrics = useMemo(
    () => coverageQuery.data?.data ?? [],
    [coverageQuery.data?.data],
  );

  const treemapData = useMemo(() => buildTreemapRoot(metrics), [metrics]);

  const historyPoints = useMemo(() => {
    if (!spec) {
      return [];
    }
    const fromApi = spec.coverageHistory ?? [];
    const merged =
      fromApi.length > 0
        ? fromApi
        : [{ date: spec.lastUpdated, coveragePercent: spec.coveragePercent }];
    return [...merged].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [spec]);

  if (specQuery.isLoading && !spec) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (specQuery.isError || !spec) {
    return (
      <main className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
        <h1 className="text-lg font-semibold text-destructive">Specification not available</h1>
        <p className="mt-2 text-sm text-destructive/90">
          {specQuery.error instanceof Error ? specQuery.error.message : "Unable to load specification."}
        </p>
      </main>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{spec.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Version {spec.version}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase">
                {spec.status}
              </span>
              <span className="text-muted-foreground">Owner: {spec.owner}</span>
              <span className="text-muted-foreground">
                Updated {new Date(spec.lastUpdated).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="rounded-lg border bg-background px-6 py-4 text-center md:text-right">
            <p className="text-sm text-muted-foreground">Coverage</p>
            <p className="text-4xl font-bold tabular-nums text-blue-600">{spec.coveragePercent}%</p>
            <p className="text-xs text-muted-foreground">
              {spec.coveredItems} / {spec.totalItems} items
            </p>
          </div>
        </div>
      </header>

      <div role="tablist" aria-label="Specification sections" className="flex gap-2 border-b">
        {(
          [
            ["overview", "Overview"],
            ["coverage", "Coverage Breakdown"],
            ["history", "History"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <section aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="sr-only">
            Overview
          </h2>
          <div className="rounded-xl border bg-card p-5 md:max-w-xl">
            <h3 className="font-semibold">Summary</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Total items</dt>
                <dd className="font-medium tabular-nums">{spec.totalItems}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Covered items</dt>
                <dd className="font-medium tabular-nums">{spec.coveredItems}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Identifier</dt>
                <dd className="font-mono text-xs">{spec.id}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">
              Open the Coverage Breakdown tab for the interactive treemap and per-section items.
            </p>
          </div>
        </section>
      ) : null}

      {tab === "coverage" ? (
        <section aria-labelledby="coverage-heading" className="space-y-6">
          <h2 id="coverage-heading" className="sr-only">
            Coverage Breakdown
          </h2>
          {coverageQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          ) : coverageQuery.isError ? (
            <p className="text-sm text-destructive">
              {coverageQuery.error instanceof Error
                ? coverageQuery.error.message
                : "Failed to load coverage breakdown."}
            </p>
          ) : (
            <>
              <div className="h-[360px] w-full rounded-xl border bg-card p-4">
                <h3 className="text-base font-semibold">Section treemap</h3>
                {metrics.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No coverage sections.</p>
                ) : (
                  <div className="mt-2 h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={treemapData}
                        dataKey="value"
                        nameKey="name"
                        stroke="hsl(var(--border))"
                        content={TreemapCell}
                      >
                        <Tooltip
                          formatter={(value, _name, item) => {
                            const payload = item?.payload as TreemapDatum | undefined;
                            const p = payload?.percent;
                            return [`${String(value)} items${p !== undefined ? ` · ${Math.round(p)}%` : ""}`, payload?.name ?? "Section"];
                          }}
                        />
                      </Treemap>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-base font-semibold">Sections & items</h3>
                {metrics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items to display.</p>
                ) : (
                  metrics.map((metric) => <SectionRow key={metric.section} metric={metric} />)
                )}
              </div>
            </>
          )}
        </section>
      ) : null}

      {tab === "history" ? (
        <section aria-labelledby="history-heading" className="rounded-xl border bg-card p-6">
          <h2 id="history-heading" className="text-lg font-semibold">
            Coverage history
          </h2>
          <ol className="relative mt-6 space-y-6 border-s border-muted-foreground/30 pl-6">
            {historyPoints.map((point) => (
              <li key={`${point.date}-${String(point.coveragePercent)}`} className="relative">
                <span className="absolute -start-[29px] mt-1 size-3 rounded-full border-2 border-background bg-blue-600" />
                <time className="text-xs text-muted-foreground">
                  {new Date(point.date).toLocaleString()}
                </time>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{point.coveragePercent}%</p>
                <div className="mt-2 h-2 max-w-xs overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${Math.min(100, point.coveragePercent)}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
