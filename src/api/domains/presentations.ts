import { apiClient } from "../apiClient";
import { endpoints } from "../endpoints";
import type { PaginatedResponse, PaginationParams, Presentation } from "../types";

export const presentationsApi = {
  create: (payload: { name: string; description?: string }) =>
    apiClient.request<Presentation>({
      path: endpoints.presentations.base,
      method: "POST",
      body: payload,
    }),

  list: (params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<Presentation>>({
      path: endpoints.presentations.base,
      method: "GET",
      query: params,
    }),

  getById: (presentationId: string) =>
    apiClient.request<Presentation>({
      path: endpoints.presentations.byId(presentationId),
      method: "GET",
    }),

  update: (presentationId: string, payload: Partial<{ name: string; description?: string }>) =>
    apiClient.request<Presentation>({
      path: endpoints.presentations.byId(presentationId),
      method: "PATCH",
      body: payload,
    }),

  remove: (presentationId: string) =>
    apiClient.request<void>({
      path: endpoints.presentations.byId(presentationId),
      method: "DELETE",
    }),
};
