import type { ReportExportFormat, ReportExportHistoryEntry } from "@/types";

const STORAGE_KEY = "sdd-report-export-history";
const MAX_ENTRIES = 40;

const isFormat = (value: string): value is ReportExportFormat =>
  value === "pdf" || value === "csv" || value === "json";

const parseHistory = (raw: string | null): ReportExportHistoryEntry[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((item): ReportExportHistoryEntry[] => {
      if (!item || typeof item !== "object") {
        return [];
      }
      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const createdAt = typeof record.createdAt === "string" ? record.createdAt : "";
      const format = typeof record.format === "string" && isFormat(record.format) ? record.format : null;
      const specificationCount =
        typeof record.specificationCount === "number" ? record.specificationCount : 0;
      const title = typeof record.title === "string" ? record.title : "";
      if (!id || !createdAt || !format || !title) {
        return [];
      }
      return [{ id, createdAt, format, specificationCount, title }];
    });
  } catch {
    return [];
  }
};

export function loadReportExportHistory(): ReportExportHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  return parseHistory(window.localStorage.getItem(STORAGE_KEY));
}

export function persistReportExportHistory(entries: ReportExportHistoryEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function appendReportExportHistory(
  entry: Omit<ReportExportHistoryEntry, "id">,
): ReportExportHistoryEntry {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const full: ReportExportHistoryEntry = { ...entry, id };
  const next = [full, ...loadReportExportHistory()].slice(0, MAX_ENTRIES);
  persistReportExportHistory(next);
  return full;
}
