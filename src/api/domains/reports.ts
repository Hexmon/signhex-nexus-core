import { apiClient } from "../apiClient";
import type { ReportSummary } from "../types";

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
};
