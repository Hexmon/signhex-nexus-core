import { apiClient } from "../apiClient";
import type { MetricsOverview } from "../types";

export const metricsApi = {
  getOverview: () =>
    apiClient.request<MetricsOverview>({
      path: "/v1/metrics/overview",
      method: "GET",
    }),
};
