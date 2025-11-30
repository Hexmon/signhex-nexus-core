import { apiClient } from "../apiClient";

export const healthApi = {
  get: () =>
    apiClient.request<{ status: string }>({
      path: "/health",
      method: "GET",
    }),
};
