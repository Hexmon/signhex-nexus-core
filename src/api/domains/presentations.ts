import { apiClient } from "../apiClient";
import type { PaginatedResponse, PaginationParams, Presentation } from "../types";

export const presentationsApi = {
  create: (payload: { name: string; description?: string }) =>
    apiClient.request<Presentation>({
      path: "/v1/presentations",
      method: "POST",
      body: payload,
    }),

  list: (params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<Presentation>>({
      path: "/v1/presentations",
      method: "GET",
      query: params,
    }),

  getById: (presentationId: string) =>
    apiClient.request<Presentation>({
      path: `/v1/presentations/${presentationId}`,
      method: "GET",
    }),

  update: (presentationId: string, payload: Partial<{ name: string; description?: string }>) =>
    apiClient.request<Presentation>({
      path: `/v1/presentations/${presentationId}`,
      method: "PATCH",
      body: payload,
    }),

  remove: (presentationId: string) =>
    apiClient.request<void>({
      path: `/v1/presentations/${presentationId}`,
      method: "DELETE",
    }),
};
