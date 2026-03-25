"use client";

import type { ReactElement } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Specification } from "@/types";
import { buildCoverageDistribution } from "@/lib/utils/dashboard";

interface CoverageDistributionProps {
  specs: Specification[];
  isLoading: boolean;
}

function DistributionSkeleton(): ReactElement {
  return <div className="h-[280px] w-full animate-pulse rounded-xl border bg-muted/40" />;
}

export function CoverageDistribution({
  specs,
  isLoading,
}: CoverageDistributionProps): ReactElement {
  const data = buildCoverageDistribution(specs);

  if (isLoading && specs.length === 0) {
    return (
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Coverage distribution</h2>
        <DistributionSkeleton />
      </section>
    );
  }

  if (specs.length === 0) {
    return (
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Coverage distribution</h2>
        <p className="mt-4 text-sm text-muted-foreground">No specifications loaded.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Coverage distribution</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Number of specifications per coverage band (current page sample).
      </p>
      <div className="mt-4 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [value ?? 0, "Specs"]}
              labelFormatter={(label) => `Coverage ${String(label)}`}
            />
            <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
