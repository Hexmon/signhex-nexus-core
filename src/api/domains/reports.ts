import { apiClient } from "../apiClient";
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
      path: "/v1/reports/summary",
      method: "GET",
    }),

  getTrends: () =>
    apiClient.request<Record<string, unknown>>({
      path: "/v1/reports/trends",
      method: "GET",
    }),

  getRequestsByDepartment: () =>
    apiClient.request<DepartmentRequestsReport[]>({
      path: "/v1/reports/requests-by-department",
      method: "GET",
    }),

  getOfflineScreens: () =>
    apiClient.request<OfflineScreensReport>({
      path: "/v1/reports/offline-screens",
      method: "GET",
    }),

  getStorageReport: () =>
    apiClient.request<StorageReport>({
      path: "/v1/reports/storage",
      method: "GET",
    }),

  getSystemHealth: () =>
    apiClient.request<SystemHealthReport>({
      path: "/v1/reports/system-health",
      method: "GET",
    }),
};
