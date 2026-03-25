"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import type { Specification } from "@/types";
import { useSpecPrefetch } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

interface TopBottomSpecsProps {
  top: Specification[];
  bottom: Specification[];
  isLoading: boolean;
}

function TableSkeleton(): ReactElement {
  return (
    <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
      {[0, 1, 2, 3, 4].map((key) => (
        <div key={key} className="h-10 animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}

function SpecsTable({
  title,
  specs,
  variant,
  onRowNavigate,
  onPrefetch,
}: {
  title: string;
  specs: Specification[];
  variant: "top" | "bottom";
  onRowNavigate: (id: string) => void;
  onPrefetch: (id: string) => void;
}): ReactElement {
  const barColor = variant === "top" ? "bg-green-600" : "bg-red-600";

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {specs.map((spec) => (
              <tr
                key={spec.id}
                className="cursor-pointer border-b last:border-0 hover:bg-muted/50"
                onClick={() => onRowNavigate(spec.id)}
                onMouseEnter={() => {
                  void onPrefetch(spec.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowNavigate(spec.id);
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={`Open specification ${spec.name}`}
              >
                <td className="max-w-[200px] truncate px-4 py-3 font-medium">{spec.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", barColor)}
                        style={{ width: `${Math.min(100, spec.coveragePercent)}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-muted-foreground">
                      {spec.coveragePercent}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TopBottomSpecs({
  top,
  bottom,
  isLoading,
}: TopBottomSpecsProps): ReactElement {
  const router = useRouter();
  const prefetchSpec = useSpecPrefetch();

  if (isLoading && top.length === 0 && bottom.length === 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="sr-only">Top specifications loading</h2>
          <TableSkeleton />
        </div>
        <div>
          <h2 className="sr-only">Bottom specifications loading</h2>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SpecsTable
        title="Top 5 by coverage"
        specs={top}
        variant="top"
        onRowNavigate={(id) => router.push(`/specifications/${id}`)}
        onPrefetch={prefetchSpec}
      />
      <SpecsTable
        title="Bottom 5 by coverage"
        specs={bottom}
        variant="bottom"
        onRowNavigate={(id) => router.push(`/specifications/${id}`)}
        onPrefetch={prefetchSpec}
      />
    </div>
  );
}
