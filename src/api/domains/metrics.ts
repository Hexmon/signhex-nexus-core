import { apiClient } from "../apiClient";
import type { MetricsOverview } from "../types";

export const metricsApi = {
  getOverview: () =>
    apiClient.request<MetricsOverview>({
      path: "/metrics/overview",
      method: "GET",
    }),
};
