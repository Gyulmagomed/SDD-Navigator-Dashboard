import { apiClient } from "@/lib/api/client";
import type {
  ApiResponse,
  CoverageMetric,
  DashboardStats,
  FilterParams,
  Specification,
} from "@/types";

export const getSpecs = async (
  params: FilterParams,
): Promise<ApiResponse<Specification[]>> => {
  const response = await apiClient.get<ApiResponse<Specification[]>>("/specifications", { params });
  return response.data;
};

export const getSpecById = async (id: string): Promise<ApiResponse<Specification>> => {
  const response = await apiClient.get<ApiResponse<Specification>>(`/specifications/${id}`);
  return response.data;
};

export const getCoverageBySpec = async (
  specId: string,
): Promise<ApiResponse<CoverageMetric[]>> => {
  const response = await apiClient.get<ApiResponse<CoverageMetric[]>>(`/coverage/${specId}`);
  return response.data;
};

export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  const response = await apiClient.get<ApiResponse<DashboardStats>>("/dashboard/stats");
  return response.data;
};

export const exportReport = async (
  specId: string,
  format: "pdf" | "csv" | "json",
): Promise<Blob> => {
  const response = await apiClient.get<Blob>(`/reports/export/${specId}`, {
    params: { format },
    responseType: "blob",
  });
  return response.data;
};
