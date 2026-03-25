"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  getCoverageBySpec,
  getDashboardStats,
  getSpecById,
  getSpecs,
} from "@/lib/api/endpoints";
import type {
  ApiResponse,
  CoverageMetric,
  DashboardStats,
  FilterParams,
  Specification,
} from "@/types";

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;

export const specQueryKey = (filters: FilterParams) => ["specs", filters] as const;
export const specByIdQueryKey = (id: string) => ["spec", id] as const;
export const coverageQueryKey = (specId: string) => ["coverage", specId] as const;
export const dashboardStatsQueryKey = ["dashboard-stats"] as const;

export const useSpecs = (
  filters: FilterParams,
  options?: { enabled?: boolean },
): UseQueryResult<ApiResponse<Specification[]>, Error> =>
  useQuery({
    queryKey: specQueryKey(filters),
    queryFn: () => getSpecs(filters),
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });

export const useSpecsInfinite = (
  filters: FilterParams,
  options?: { enabled?: boolean },
): UseInfiniteQueryResult<
  InfiniteData<ApiResponse<Specification[]>, number>,
  Error
> => {
  const pageSize = filters.pageSize ?? 20;
  const rest = { ...filters };
  delete rest.page;
  return useInfiniteQuery<
    ApiResponse<Specification[]>,
    Error,
    InfiniteData<ApiResponse<Specification[]>, number>,
    readonly [string, Omit<FilterParams, "page">, number],
    number
  >({
    queryKey: ["specs-infinite", rest, pageSize] as const,
    queryFn: ({ pageParam }) =>
      getSpecs({ ...rest, page: pageParam, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
    enabled: options?.enabled ?? true,
  });
};

export const useSpecById = (
  id: string,
): UseQueryResult<ApiResponse<Specification>, Error> =>
  useQuery({
    queryKey: specByIdQueryKey(id),
    queryFn: () => getSpecById(id),
    enabled: Boolean(id),
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });

export const useSpecPrefetch = (): ((id: string) => Promise<void>) => {
  const queryClient = useQueryClient();

  return async (id: string): Promise<void> => {
    if (!id) {
      return;
    }

    await queryClient.prefetchQuery({
      queryKey: specByIdQueryKey(id),
      queryFn: () => getSpecById(id),
      staleTime: FIVE_MINUTES,
    });
  };
};

export const useCoverage = (
  specId: string | null | undefined,
): UseQueryResult<ApiResponse<CoverageMetric[]>, Error> =>
  useQuery({
    queryKey: coverageQueryKey(specId ?? ""),
    queryFn: () => getCoverageBySpec(specId ?? ""),
    enabled: Boolean(specId),
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
  });

export const useDashboardStats = (): UseQueryResult<ApiResponse<DashboardStats>, Error> =>
  useQuery({
    queryKey: dashboardStatsQueryKey,
    queryFn: getDashboardStats,
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
    refetchInterval: ONE_MINUTE,
  });
