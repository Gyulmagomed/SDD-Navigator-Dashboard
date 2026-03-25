"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportReport } from "@/lib/api/endpoints";
import { useDashboardStats, useSpecs } from "@/lib/api/hooks";
import { buildJsonReportPayload } from "@/lib/utils/build-json-report";
import { downloadBlob, downloadTextFile } from "@/lib/utils/csv";
import {
  appendReportExportHistory,
  loadReportExportHistory,
} from "@/lib/utils/report-export-history";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { cn } from "@/lib/utils";
import type { ReportExportFormat, ReportExportHistoryEntry, Specification } from "@/types";

const SPECS_PAGE_SIZE = 250;

export function ReportsWorkspace(): ReactElement {
  const specsQuery = useSpecs({
    page: 1,
    pageSize: SPECS_PAGE_SIZE,
    sortBy: "name",
    sortOrder: "asc",
  });
  const statsQuery = useDashboardStats();

  const specifications = useMemo(
    () => specsQuery.data?.data ?? [],
    [specsQuery.data?.data],
  );

  const [pickerQuery, setPickerQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState<ReportExportFormat>("pdf");
  const [includeKpi, setIncludeKpi] = useState(true);
  const [includeDetail, setIncludeDetail] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<ReportExportHistoryEntry[]>([]);

  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleCadence, setScheduleCadence] = useState<"weekly" | "monthly">("weekly");
  const [scheduleNote, setScheduleNote] = useState<string | null>(null);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    setHistory(loadReportExportHistory());
  }, []);

  const filteredSpecifications = useMemo(() => {
    const needle = pickerQuery.trim().toLowerCase();
    if (!needle) {
      return specifications;
    }
    return specifications.filter(
      (spec) =>
        spec.name.toLowerCase().includes(needle) ||
        spec.owner.toLowerCase().includes(needle) ||
        spec.id.toLowerCase().includes(needle),
    );
  }, [specifications, pickerQuery]);

  const selectedSpecifications = useMemo(
    () => specifications.filter((spec) => selectedIds.has(spec.id)),
    [specifications, selectedIds],
  );

  const toggleSpec = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllFiltered = (): void => {
    const visibleIds = filteredSpecifications.map((spec) => spec.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const refreshHistory = useCallback(() => {
    setHistory(loadReportExportHistory());
  }, []);

  const handleGenerate = async (): Promise<void> => {
    setStatusMessage(null);
    const ids = selectedSpecifications.map((spec) => spec.id);
    if (ids.length === 0) {
      setStatusMessage("Choose at least one specification.");
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      if (format === "json") {
        const payload = await buildJsonReportPayload({
          dateFrom,
          dateTo,
          includeKpi,
          includeDetail,
          includeTrends,
          dashboardStats: statsQuery.data?.data,
          specifications: selectedSpecifications,
        });
        const text = JSON.stringify(payload, null, 2);
        downloadTextFile(`sdd-report-${Date.now()}.json`, text, "application/json;charset=utf-8");
        appendReportExportHistory({
          createdAt: new Date().toISOString(),
          format: "json",
          specificationCount: ids.length,
          title: `JSON · ${ids.length} specification${ids.length === 1 ? "" : "s"}`,
        });
        setProgress(100);
        refreshHistory();
        toast.success(`JSON report ready (${String(ids.length)} specifications).`);
        addNotification({
          title: "Report generated",
          body: `JSON export with ${String(ids.length)} specifications.`,
        });
        return;
      }

      for (let index = 0; index < ids.length; index += 1) {
        const specId = ids[index];
        const blob = await exportReport(specId, format);
        const safeId = specId.replace(/[^a-zA-Z0-9-_]/g, "_");
        downloadBlob(`sdd-report-${safeId}-${Date.now()}-${String(index)}.${format}`, blob);
        setProgress(Math.round(((index + 1) / ids.length) * 100));
      }

      appendReportExportHistory({
        createdAt: new Date().toISOString(),
        format,
        specificationCount: ids.length,
        title: `${format.toUpperCase()} · ${ids.length} file${ids.length === 1 ? "" : "s"}`,
      });
      refreshHistory();
      toast.success(
        `${format.toUpperCase()} export finished (${String(ids.length)} file${ids.length === 1 ? "" : "s"}).`,
      );
      addNotification({
        title: "Report exported",
        body: `${format.toUpperCase()} · ${String(ids.length)} file(s).`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Report generation failed.";
      setStatusMessage(message);
      toast.error(message);
      addNotification({ title: "Export failed", body: message });
    } finally {
      setGenerating(false);
    }
  };

  const saveSchedulePreference = (): void => {
    const trimmed = scheduleEmail.trim();
    if (!trimmed) {
      setScheduleNote("Add an email address to save.");
      return;
    }
    window.localStorage.setItem(
      "sdd-scheduled-report-preference",
      JSON.stringify({
        email: trimmed,
        cadence: scheduleCadence,
        savedAt: new Date().toISOString(),
      }),
    );
    setScheduleNote("Saved in this browser only. Backend scheduling is not wired yet.");
  };

  const previewLines = useMemo(() => {
    const lines: string[] = [];
    lines.push(
      `Specifications: ${selectedSpecifications.length} selected (${selectedSpecifications
        .slice(0, 3)
        .map((specification) => specification.name)
        .join(", ")}${selectedSpecifications.length > 3 ? ", …" : ""})`,
    );
    lines.push(`Date range: ${dateFrom || "—"} → ${dateTo || "—"}`);
    lines.push(`Format: ${format.toUpperCase()}`);
    lines.push(
      `Includes: KPI ${includeKpi ? "yes" : "no"}, detail ${includeDetail ? "yes" : "no"}, trends ${includeTrends ? "yes" : "no"}`,
    );
    if (format !== "json" && selectedSpecifications.length > 1) {
      lines.push(`API export will download ${selectedSpecifications.length} separate files.`);
    }
    if (format === "json") {
      lines.push("JSON is assembled client-side to match the options above.");
    }
    return lines;
  }, [
    selectedSpecifications,
    dateFrom,
    dateTo,
    format,
    includeKpi,
    includeDetail,
    includeTrends,
  ]);

  const allFilteredSelected =
    filteredSpecifications.length > 0 &&
    filteredSpecifications.every((specification) => selectedIds.has(specification.id));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure exports, preview scope, and review recent downloads. PDF and CSV use the API;
          JSON is built locally to bundle KPI / trends / coverage detail.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">Report settings</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium">
              From
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              To
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Format
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as ReportExportFormat)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </label>

          <fieldset className="space-y-2 rounded-lg border px-3 py-3">
            <legend className="px-1 text-sm font-medium">Include in report</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeKpi}
                onChange={(event) => setIncludeKpi(event.target.checked)}
              />
              KPI summary block
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeDetail}
                onChange={(event) => setIncludeDetail(event.target.checked)}
              />
              Coverage detail per specification
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeTrends}
                onChange={(event) => setIncludeTrends(event.target.checked)}
              />
              Coverage trends
            </label>
          </fieldset>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Specifications</h3>
              <Button type="button" variant="outline" size="sm" onClick={toggleAllFiltered}>
                {allFilteredSelected ? "Clear filtered" : "Select filtered"}
              </Button>
            </div>
            <input
              type="search"
              value={pickerQuery}
              onChange={(event) => setPickerQuery(event.target.value)}
              placeholder="Filter by name, owner, or id"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              aria-label="Filter specification list"
            />
            <div className="max-h-64 overflow-y-auto rounded-md border">
              {specsQuery.isLoading ? (
                <p className="p-3 text-sm text-muted-foreground">Loading specifications…</p>
              ) : specsQuery.isError ? (
                <p className="p-3 text-sm text-destructive">Could not load specifications.</p>
              ) : filteredSpecifications.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No matches.</p>
              ) : (
                <ul className="divide-y">
                  {filteredSpecifications.map((specification: Specification) => (
                    <li key={specification.id} className="flex items-start gap-2 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(specification.id)}
                        onChange={() => toggleSpec(specification.id)}
                        aria-label={`Select ${specification.name}`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{specification.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {specification.coveragePercent}% · {specification.owner}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">Preview</h2>
          <div className="rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-relaxed">
            {previewLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {statsQuery.data?.data && includeKpi ? (
              <p className="mt-3 text-[11px] text-muted-foreground">
                KPI snapshot: {statsQuery.data.data.totalSpecs} specs, avg{" "}
                {Math.round(statsQuery.data.data.avgCoverage)}% coverage.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              disabled={generating || selectedSpecifications.length === 0}
              className="w-full sm:w-auto"
              onClick={() => void handleGenerate()}
            >
              {generating ? "Generating…" : "Generate"}
            </Button>
            {generating ? (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width] duration-300"
                  style={{ width: `${String(progress)}%` }}
                />
              </div>
            ) : null}
            {statusMessage ? (
              <p className="text-sm text-destructive" role="alert">
                {statusMessage}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">Recent exports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Stored locally in your browser for quick reference.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">Format</th>
                <th className="py-2 pr-4 font-medium">Specs</th>
                <th className="py-2 font-medium">Summary</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    No exports yet.
                  </td>
                </tr>
              ) : (
                history.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 tabular-nums text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 uppercase">{entry.format}</td>
                    <td className="py-2 pr-4 tabular-nums">{entry.specificationCount}</td>
                    <td className="py-2">{entry.title}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-dashed bg-muted/20 p-5">
        <h2 className="text-base font-semibold">Scheduled delivery</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          UI-only prototype: pick cadence and email. No server jobs are created yet.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Email
            <input
              type="email"
              value={scheduleEmail}
              onChange={(event) => setScheduleEmail(event.target.value)}
              placeholder="team@example.com"
              className="rounded-md border bg-background px-3 py-2 text-sm"
              autoComplete="email"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Frequency
            <select
              value={scheduleCadence}
              onChange={(event) =>
                setScheduleCadence(event.target.value === "monthly" ? "monthly" : "weekly")
              }
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>
        <Button type="button" variant="secondary" className="mt-4" onClick={saveSchedulePreference}>
          Save schedule preference
        </Button>
        {scheduleNote ? (
          <p className={cn("mt-2 text-sm", scheduleNote.includes("only") ? "text-amber-700 dark:text-amber-400" : "text-destructive")}>
            {scheduleNote}
          </p>
        ) : null}
      </section>
    </div>
  );
}
