import { apiClient } from "../apiClient";
import type { EmergencyStatus, PaginatedResponse, PaginationParams } from "../types";

export const emergencyApi = {
  trigger: (payload: { message?: string }) =>
    apiClient.request<EmergencyStatus>({
      path: "/v1/emergency/trigger",
      method: "POST",
      body: payload,
    }),

  status: () =>
    apiClient.request<EmergencyStatus>({
      path: "/v1/emergency/status",
      method: "GET",
    }),

  clear: (emergencyId: string) =>
    apiClient.request<void>({
      path: `/v1/emergency/${emergencyId}/clear`,
      method: "POST",
    }),

  history: (params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<EmergencyStatus>>({
      path: "/v1/emergency/history",
      method: "GET",
      query: params,
    }),
};
