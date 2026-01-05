import { apiClient } from "../apiClient";
import { endpoints } from "../endpoints";
import type { EmergencyStatus, PaginatedResponse, PaginationParams } from "../types";

export const emergencyApi = {
  trigger: (payload: { message?: string }) =>
    apiClient.request<EmergencyStatus>({
      path: endpoints.emergency.trigger,
      method: "POST",
      body: payload,
    }),

  status: () =>
    apiClient.request<EmergencyStatus>({
      path: endpoints.emergency.status,
      method: "GET",
    }),

  clear: (emergencyId: string) =>
    apiClient.request<void>({
      path: endpoints.emergency.clear(emergencyId),
      method: "POST",
    }),

  history: (params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<EmergencyStatus>>({
      path: endpoints.emergency.history,
      method: "GET",
      query: params,
    }),
};
