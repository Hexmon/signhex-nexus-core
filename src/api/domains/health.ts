import { apiClient } from "../apiClient";
import type { HealthStatus } from "../types";

export const healthApi = {
  get: () =>
    apiClient.request<HealthStatus>({
      path: "/v1/health",
      method: "GET",
    }),
};
