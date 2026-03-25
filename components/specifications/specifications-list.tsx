"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";
import { useSpecPrefetch, useSpecs, useSpecsInfinite } from "@/lib/api/hooks";
import { usePreferencesStore } from "@/lib/store/preferencesStore";
import type { FilterParams, SortOrder, Specification } from "@/types";
import { downloadTextFile, specificationsToCsv } from "@/lib/utils/csv";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

type SortField = "name" | "coveragePercent" | "lastUpdated";

function readParams(searchParams: URLSearchParams): FilterParams {
  const pageRaw = searchParams.get("page");
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);
  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const owner = searchParams.get("owner") ?? undefined;
  const sortByRaw = searchParams.get("sortBy") ?? "name";
  const sortBy: SortField =
    sortByRaw === "coverage" || sortByRaw === "coveragePercent"
      ? "coveragePercent"
      : sortByRaw === "lastUpdated"
        ? "lastUpdated"
        : "name";
  const sortOrder = (searchParams.get("sortOrder") ?? "asc") as SortOrder;
  const normalizedOrder: SortOrder = sortOrder === "desc" ? "desc" : "asc";

  return {
    page,
    pageSize: PAGE_SIZE,
    search: search?.trim() || undefined,
    status: status?.trim() || undefined,
    owner: owner?.trim() || undefined,
    sortBy,
    sortOrder: normalizedOrder,
  };
}

function buildQueryString(base: URLSearchParams, updates: Record<string, string | undefined>): string {
  const next = new URLSearchParams(base.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  const qs = next.toString();
  return qs ? `?${qs}` : "";
}

function StatusBadge({ status }: { status: string }): ReactElement {
  const normalized = status.toLowerCase();
  const className =
    normalized === "active"
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      : normalized === "draft"
        ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        : normalized === "archived"
          ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
          : "bg-muted text-foreground";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
}

function InlineProgress({ value }: { value: number }): ReactElement {
  const safe = Math.max(0, Math.min(100, value));
  const color =
    safe >= 80 ? "bg-green-600" : safe >= 50 ? "bg-amber-500" : "bg-red-600";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 max-w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${safe}%` }} />
      </div>
      <span className="tabular-nums text-xs text-muted-foreground">{safe}%</span>
    </div>
  );
}

export function SpecificationsList(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefetchSpec = useSpecPrefetch();

  const filterParams = useMemo(() => readParams(searchParams), [searchParams]);

  const [searchInput, setSearchInput] = useState(() => readParams(searchParams).search ?? "");
  const [ownerInput, setOwnerInput] = useState(() => readParams(searchParams).owner ?? "");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const nextHref = buildQueryString(searchParams, updates);
      router.replace(`/specifications${nextHref}`, { scroll: false });
    },
    [router, searchParams],
  );

  const onSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    setSearchInput(value);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      pushFilters({ search: value.trim() || undefined, page: "1" });
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const specsListMode = usePreferencesStore((state) => state.specsListMode);
  const paginatedQuery = useSpecs(filterParams, { enabled: specsListMode === "pagination" });
  const infiniteQuery = useSpecsInfinite(filterParams, { enabled: specsListMode === "infinite" });

  const specs: Specification[] =
    specsListMode === "pagination"
      ? paginatedQuery.data?.data ?? []
      : infiniteQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const meta =
    specsListMode === "pagination"
      ? paginatedQuery.data?.meta
      : infiniteQuery.data?.pages.length
        ? infiniteQuery.data.pages[infiniteQuery.data.pages.length - 1]?.meta
        : undefined;

  const queryIsLoading =
    specsListMode === "pagination" ? paginatedQuery.isLoading : infiniteQuery.isPending;
  const queryIsError =
    specsListMode === "pagination" ? paginatedQuery.isError : infiniteQuery.isError;
  const queryError =
    specsListMode === "pagination" ? paginatedQuery.error : infiniteQuery.error;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (specsListMode !== "infinite") {
      return;
    }
    if (!infiniteQuery.hasNextPage) {
      return;
    }
    const node = sentinelRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry?.isIntersecting &&
          infiniteQuery.hasNextPage &&
          !infiniteQuery.isFetchingNextPage
        ) {
          void infiniteQuery.fetchNextPage();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    specsListMode,
    infiniteQuery.hasNextPage,
    infiniteQuery.isFetchingNextPage,
    infiniteQuery.fetchNextPage,
    infiniteQuery,
  ]);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allOnPageSelected =
    specs.length > 0 && specs.every((specification) => selected.has(specification.id));

  const toggleAllOnPage = (): void => {
    if (allOnPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const specification of specs) {
          next.delete(specification.id);
        }
        return next;
      });
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      for (const specification of specs) {
        next.add(specification.id);
      }
      return next;
    });
  };

  const toggleRow = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exportSelected = (): void => {
    const selectedSpecs = specs.filter((specification) => selected.has(specification.id));
    if (selectedSpecs.length === 0) {
      return;
    }
    const csv = specificationsToCsv(selectedSpecs);
    downloadTextFile(`specifications-export-${Date.now()}.csv`, csv, "text/csv;charset=utf-8");
  };

  const [pageDraft, setPageDraft] = useState(() => String(readParams(searchParams).page ?? 1));

  const commitPageInput = (): void => {
    const raw = pageDraft.trim();
    const parsed = Number.parseInt(raw, 10);
    const max = meta?.totalPages ?? 1;
    const nextPage = Number.isFinite(parsed) ? Math.min(Math.max(1, parsed), max) : 1;
    pushFilters({ page: String(nextPage) });
  };

  const sortValueForSelect = (): string => {
    if (filterParams.sortBy === "coveragePercent") {
      return "coverage";
    }
    return filterParams.sortBy ?? "name";
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Specifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse specifications, filter by metadata, and open detail views.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:flex-wrap md:items-end">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm font-medium">
          Search
          <input
            value={searchInput}
            onChange={onSearchChange}
            placeholder="Filter by name..."
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2"
            type="search"
            aria-label="Search specifications"
          />
        </label>

        <label className="flex w-full flex-col gap-1 text-sm font-medium md:w-40">
          Status
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2"
            value={filterParams.status ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              pushFilters({ status: value || undefined, page: "1" });
            }}
            aria-label="Filter by status"
          >
            <option value="">All</option>
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="archived">archived</option>
          </select>
        </label>

        <label className="flex min-w-[160px] flex-col gap-1 text-sm font-medium md:w-48">
          Owner
          <input
            value={ownerInput}
            onChange={(event) => setOwnerInput(event.target.value)}
            onBlur={() => {
              const value = ownerInput.trim();
              pushFilters({
                owner: value || undefined,
                page: "1",
              });
            }}
            placeholder="Owner name"
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2"
            aria-label="Filter by owner"
          />
        </label>

        <label className="flex w-full flex-col gap-1 text-sm font-medium md:w-44">
          Sort by
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2"
            value={sortValueForSelect()}
            onChange={(event) => {
              const value = event.target.value;
              const urlSort =
                value === "coverage"
                  ? "coverage"
                  : value === "lastUpdated"
                    ? "lastUpdated"
                    : "name";
              pushFilters({ sortBy: urlSort, page: "1" });
            }}
            aria-label="Sort specifications"
          >
            <option value="name">Name</option>
            <option value="coverage">Coverage</option>
            <option value="lastUpdated">Last updated</option>
          </select>
        </label>

        <label className="flex w-full flex-col gap-1 text-sm font-medium md:w-36">
          Order
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2"
            value={filterParams.sortOrder ?? "asc"}
            onChange={(event) => {
              const value = event.target.value === "desc" ? "desc" : "asc";
              pushFilters({ sortOrder: value, page: "1" });
            }}
            aria-label="Sort order"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>

        <div className="flex gap-2 md:ml-auto">
          <Button
            type="button"
            variant="outline"
            disabled={selected.size === 0}
            onClick={exportSelected}
            aria-label="Export selected specifications as CSV"
          >
            Export selected
          </Button>
        </div>
      </div>

      {queryIsError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {queryError instanceof Error ? queryError.message : "Failed to load specifications."}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    aria-label={
                      specsListMode === "infinite"
                        ? "Select all loaded specifications"
                        : "Select all on this page"
                    }
                  />
                </th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Version</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Coverage</th>
                <th className="px-3 py-3 font-medium">Owner</th>
                <th className="px-3 py-3 font-medium">Last updated</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queryIsLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`skeleton-row-${String(index)}`} className="border-b">
                      <td className="px-3 py-3" colSpan={8}>
                        <div className="h-10 animate-pulse rounded bg-muted" />
                      </td>
                    </tr>
                  ))
                : specs.map((specification) => (
                    <tr
                      key={specification.id}
                      className="cursor-pointer border-b hover:bg-muted/40"
                      onMouseEnter={() => {
                        void prefetchSpec(specification.id);
                      }}
                      onClick={(event) => {
                        const target = event.target as HTMLElement;
                        if (target.closest("input, a, button")) {
                          return;
                        }
                        router.push(`/specifications/${specification.id}`);
                      }}
                      onKeyDown={(event) => {
                        if (event.target instanceof HTMLInputElement) {
                          return;
                        }
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/specifications/${specification.id}`);
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={`Open specification ${specification.name}`}
                    >
                      <td
                        className="px-3 py-3"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(specification.id)}
                          onChange={() => toggleRow(specification.id)}
                          aria-label={`Select ${specification.name}`}
                        />
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-3 font-medium">
                        {specification.name}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{specification.version}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={specification.status} />
                      </td>
                      <td className="px-3 py-3">
                        <InlineProgress value={specification.coveragePercent} />
                      </td>
                      <td className="px-3 py-3">{specification.owner}</td>
                      <td className="px-3 py-3 tabular-nums text-muted-foreground">
                        {new Date(specification.lastUpdated).toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/specifications/${specification.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!queryIsLoading && specs.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No specifications found.</p>
        ) : null}
      </div>

      {specsListMode === "pagination" && meta ? (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            Page{" "}
            <span className="font-medium text-foreground">
              {meta.page} / {meta.totalPages}
            </span>
            <span className="mx-2">·</span>
            <span>
              {meta.total} total
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => pushFilters({ page: String(meta.page - 1) })}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              <label htmlFor="spec-page-input" className="text-muted-foreground">
                Go to
              </label>
              <input
                id="spec-page-input"
                value={pageDraft}
                onChange={(event) => setPageDraft(event.target.value)}
                onBlur={commitPageInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitPageInput();
                  }
                }}
                className="w-16 rounded-md border bg-background px-2 py-1 text-center tabular-nums outline-none ring-offset-2 focus-visible:ring-2"
                inputMode="numeric"
                aria-label="Page number"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => pushFilters({ page: String(meta.page + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {specsListMode === "infinite" ? (
        <div className="space-y-2">
          <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
          {infiniteQuery.isFetchingNextPage ? (
            <p className="text-center text-sm text-muted-foreground">Loading more specifications…</p>
          ) : null}
          {!infiniteQuery.hasNextPage && specs.length > 0 ? (
            <p className="text-center text-sm text-muted-foreground">End of list.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
