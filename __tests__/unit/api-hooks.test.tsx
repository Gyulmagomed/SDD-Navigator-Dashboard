import React, { type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  useCoverage,
  useDashboardStats,
  useSpecPrefetch,
  useSpecs,
} from "@/lib/api/hooks";
import * as endpoints from "@/lib/api/endpoints";

jest.mock("@/lib/api/endpoints");

const mockedEndpoints = endpoints as jest.Mocked<typeof endpoints>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe("api hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads dashboard stats", async () => {
    mockedEndpoints.getDashboardStats.mockResolvedValue({
      data: { totalSpecs: 10, avgCoverage: 72, criticalGaps: 2, trend: [] },
      meta: { page: 1, pageSize: 1, total: 1, totalPages: 1 },
    });

    const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedEndpoints.getDashboardStats).toHaveBeenCalledTimes(1);
    expect(result.current.data?.data.totalSpecs).toBe(10);
  });

  it("does not request coverage when spec id is missing", async () => {
    const { result } = renderHook(() => useCoverage(undefined), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockedEndpoints.getCoverageBySpec).not.toHaveBeenCalled();
  });

  it("prefetches specification details", async () => {
    mockedEndpoints.getSpecById.mockResolvedValue({
      data: {
        id: "spec-1",
        name: "Spec 1",
        version: "1.0.0",
        status: "active",
        totalItems: 10,
        coveredItems: 8,
        coveragePercent: 80,
        lastUpdated: "2026-03-20",
        owner: "team-a",
      },
      meta: { page: 1, pageSize: 1, total: 1, totalPages: 1 },
    });

    const { result } = renderHook(() => useSpecPrefetch(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current("spec-1");
    });

    expect(mockedEndpoints.getSpecById).toHaveBeenCalledWith("spec-1");
  });

  it("loads specs list with filters", async () => {
    mockedEndpoints.getSpecs.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });

    const { result } = renderHook(
      () => useSpecs({ search: "auth", sortBy: "name", sortOrder: "asc" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedEndpoints.getSpecs).toHaveBeenCalledWith({
      search: "auth",
      sortBy: "name",
      sortOrder: "asc",
    });
  });
});
