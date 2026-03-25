import { getCoverageBySpec } from "@/lib/api/endpoints";
import type { CoverageMetric, DashboardStats, Specification } from "@/types";

export interface BuildJsonReportInput {
  dateFrom: string;
  dateTo: string;
  includeKpi: boolean;
  includeDetail: boolean;
  includeTrends: boolean;
  dashboardStats: DashboardStats | undefined;
  specifications: Specification[];
}

export async function buildJsonReportPayload(
  input: BuildJsonReportInput,
): Promise<Record<string, unknown>> {
  const coverageBySpec: Record<string, CoverageMetric[] | null> = {};

  if (input.includeDetail && input.specifications.length > 0) {
    await Promise.all(
      input.specifications.map(async (spec) => {
        try {
          const response = await getCoverageBySpec(spec.id);
          coverageBySpec[spec.id] = response.data;
        } catch {
          coverageBySpec[spec.id] = null;
        }
      }),
    );
  }

  const specificationsOut = input.specifications.map((spec) => {
    const row: Record<string, unknown> = {
      id: spec.id,
      name: spec.name,
      version: spec.version,
      status: spec.status,
      totalItems: spec.totalItems,
      coveredItems: spec.coveredItems,
      coveragePercent: spec.coveragePercent,
      lastUpdated: spec.lastUpdated,
      owner: spec.owner,
    };
    if (input.includeDetail) {
      row.coverageBreakdown = coverageBySpec[spec.id] ?? null;
    }
    return row;
  });

  return {
    generatedAt: new Date().toISOString(),
    dateRange: {
      from: input.dateFrom.length > 0 ? input.dateFrom : null,
      to: input.dateTo.length > 0 ? input.dateTo : null,
    },
    options: {
      kpi: input.includeKpi,
      detail: input.includeDetail,
      trends: input.includeTrends,
    },
    kpi: input.includeKpi && input.dashboardStats ? input.dashboardStats : undefined,
    trends: input.includeTrends && input.dashboardStats ? input.dashboardStats.trend : undefined,
    specifications: specificationsOut,
  };
}
