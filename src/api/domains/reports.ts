import { apiClient } from "../apiClient";
import { endpoints } from "../endpoints";
import type {
  DepartmentRequestsReport,
  OfflineScreensReport,
  ReportSummary,
  StorageReport,
  SystemHealthReport,
} from "../types";

export const reportsApi = {
  getSummary: () =>
    apiClient.request<ReportSummary>({
      path: endpoints.reports.summary,
      method: "GET",
    }),

  getTrends: () =>
    apiClient.request<Record<string, unknown>>({
      path: endpoints.reports.trends,
      method: "GET",
    }),

  getRequestsByDepartment: () =>
    apiClient.request<DepartmentRequestsReport[]>({
      path: endpoints.reports.requestsByDepartment,
      method: "GET",
    }),

  getOfflineScreens: () =>
    apiClient.request<OfflineScreensReport>({
      path: endpoints.reports.offlineScreens,
      method: "GET",
    }),

  getStorageReport: () =>
    apiClient.request<StorageReport>({
      path: endpoints.reports.storage,
      method: "GET",
    }),

  getSystemHealth: () =>
    apiClient.request<SystemHealthReport>({
      path: endpoints.reports.systemHealth,
      method: "GET",
    }),
};
