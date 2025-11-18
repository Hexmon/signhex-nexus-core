import { apiClient } from "../apiClient";
import type { PaginatedResponse, PaginationParams, Screen } from "../types";

export const screensApi = {
  list: (params?: PaginationParams & { status?: string }) =>
    apiClient.request<PaginatedResponse<Screen>>({
      path: "/v1/screens",
      method: "GET",
      query: params,
    }),

  create: (payload: { name: string; location?: string }) =>
    apiClient.request<Screen>({
      path: "/v1/screens",
      method: "POST",
      body: payload,
    }),

  update: (id: string, payload: Partial<{ name: string; location?: string; status?: string }>) =>
    apiClient.request<Screen>({
      path: `/v1/screens/${id}`,
      method: "PATCH",
      body: payload,
    }),
};
