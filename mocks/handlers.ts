import { rest } from "msw";
import type { ApiResponse, CoverageMetric, DashboardStats, Specification } from "@/types";

const specs: Specification[] = Array.from({ length: 30 }).map((_, index) => ({
  id: `spec-${index + 1}`,
  name: `Specification ${index + 1}`,
  version: "1.0.0",
  status: index % 2 === 0 ? "active" : "draft",
  totalItems: 100,
  coveredItems: Math.max(0, 100 - index * 2),
  coveragePercent: Math.max(10, 100 - index * 2),
  lastUpdated: "2026-03-20T10:00:00.000Z",
  owner: index % 2 === 0 ? "team-a" : "team-b",
}));

const dashboardStats: DashboardStats = {
  totalSpecs: specs.length,
  avgCoverage: 74.2,
  criticalGaps: 3,
  fullyCoveredSpecs: 2,
  totalSpecsDeltaLastWeek: 4,
  trend: [
    { date: "2026-01-01", coverage: 61 },
    { date: "2026-02-01", coverage: 68 },
    { date: "2026-03-01", coverage: 74 },
  ],
};

const response = <T,>(data: T, page: number, pageSize: number, total: number): ApiResponse<T> => ({
  data,
  meta: {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  },
});

export const handlers = [
  rest.get("*/dashboard/stats", (_req, res, ctx) => res(ctx.json(response(dashboardStats, 1, 1, 1)))),
  rest.get("*/specifications", (req, res, ctx) => {
    const url = new URL(req.url.toString());
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const start = (page - 1) * pageSize;
    const data = specs.slice(start, start + pageSize);
    return res(ctx.json(response(data, page, pageSize, specs.length)));
  }),
  rest.get("*/specifications/:id", (req, res, ctx) => {
    const id = String(req.params.id);
    const found = specs.find((spec) => spec.id === id);
    if (!found) {
      return res(ctx.status(404), ctx.json({ message: "Not found" }));
    }
    return res(ctx.json(response(found, 1, 1, 1)));
  }),
  rest.get("*/coverage/:specId", (req, res, ctx) => {
    const specId = String(req.params.specId);
    const metrics: CoverageMetric[] = [
      {
        specId,
        section: "Architecture",
        percent: 82,
        items: [
          { id: "a-1", title: "Service boundaries", status: "covered", linkedComponents: ["svc-a"] },
        ],
      },
      {
        specId,
        section: "Security",
        percent: 45,
        items: [
          { id: "s-1", title: "Input validation", status: "partial", linkedComponents: ["api-gw"] },
          { id: "s-2", title: "Audit trails", status: "not_covered", linkedComponents: [] },
        ],
      },
    ];
    return res(ctx.json(response(metrics, 1, metrics.length, metrics.length)));
  }),
];
