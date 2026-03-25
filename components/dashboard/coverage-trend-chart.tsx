"use client";

import { useMemo, useState, type ReactElement } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/types";
import { filterTrendByWindow, type TrendWindowDays } from "@/lib/utils/dashboard";
import { cn } from "@/lib/utils";

interface CoverageTrendChartProps {
  trend: TrendPoint[] | undefined;
  isLoading: boolean;
}

function ChartSkeleton(): ReactElement {
  return (
    <div className="h-[320px] w-full animate-pulse rounded-xl border bg-muted/40" />
  );
}

const WINDOWS: TrendWindowDays[] = [30, 60, 90];

export function CoverageTrendChart({
  trend,
  isLoading,
}: CoverageTrendChartProps): ReactElement {
  const [windowDays, setWindowDays] = useState<TrendWindowDays>(30);

  const chartData = useMemo(() => {
    if (!trend?.length) {
      return [];
    }
    return filterTrendByWindow(trend, windowDays).map((point) => ({
      ...point,
      label: new Date(point.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [trend, windowDays]);

  if (isLoading && !trend?.length) {
    return (
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Coverage trend</h2>
        </div>
        <ChartSkeleton />
      </section>
    );
  }

  if (!trend?.length) {
    return (
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Coverage trend</h2>
        <p className="mt-4 text-sm text-muted-foreground">No trend data from API.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Coverage trend</h2>
        <div
          className="flex rounded-lg border p-0.5"
          role="group"
          aria-label="Trend window"
        >
          {WINDOWS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setWindowDays(days)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                windowDays === days
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(value) => [`${value ?? 0}%`, "Coverage"]}
              labelFormatter={(_label, payload) => {
                const raw = payload?.[0]?.payload as { date?: string } | undefined;
                return raw?.date
                  ? new Date(raw.date).toLocaleDateString()
                  : "";
              }}
            />
            <ReferenceLine
              y={80}
              stroke="#16a34a"
              strokeDasharray="4 4"
              label={{ value: "80% target", position: "insideTopRight", fill: "#16a34a" }}
            />
            <Line
              type="monotone"
              dataKey="coverage"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="Coverage"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
