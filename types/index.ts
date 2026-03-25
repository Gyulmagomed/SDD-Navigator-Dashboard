export type CoverageStatus = "covered" | "partial" | "not_covered";

export interface CoverageHistoryPoint {
  date: string;
  coveragePercent: number;
}

export interface Specification {
  id: string;
  name: string;
  version: string;
  status: string;
  totalItems: number;
  coveredItems: number;
  coveragePercent: number;
  lastUpdated: string;
  owner: string;
  /** Optional per-spec coverage timeline from API. */
  coverageHistory?: CoverageHistoryPoint[];
}

export interface CoverageItem {
  id: string;
  title: string;
  status: CoverageStatus;
  linkedComponents: string[];
}

export interface CoverageMetric {
  specId: string;
  section: string;
  items: CoverageItem[];
  percent: number;
}

export interface TrendPoint {
  date: string;
  coverage: number;
}

export interface DashboardStats {
  totalSpecs: number;
  avgCoverage: number;
  criticalGaps: number;
  trend: TrendPoint[];
  /** Net change in total spec count vs 7 days ago (optional from API). */
  totalSpecsDeltaLastWeek?: number;
  /** Count of specs with 100% coverage (optional from API). */
  fullyCoveredSpecs?: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  meta: PaginationMeta;
  error?: ApiError;
}

export type ReportExportFormat = "pdf" | "csv" | "json";

export interface ReportExportHistoryEntry {
  id: string;
  createdAt: string;
  format: ReportExportFormat;
  specificationCount: number;
  title: string;
}

export type SortOrder = "asc" | "desc";

export interface FilterParams {
  status?: string;
  owner?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
}
