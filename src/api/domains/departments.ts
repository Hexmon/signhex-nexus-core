import { apiClient } from "../apiClient";
import { endpoints } from "../endpoints";
import type { Department, PaginatedResponse, PaginationParams } from "../types";

export const departmentsApi = {
  list: (params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<Department>>({
      path: endpoints.departments.base,
      method: "GET",
      query: params,
    }),

  create: (payload: { name: string; description?: string }) =>
    apiClient.request<Department>({
      path: endpoints.departments.base,
      method: "POST",
      body: payload,
    }),

  getById: (id: string) =>
    apiClient.request<Department>({
      path: endpoints.departments.byId(id),
      method: "GET",
    }),

  update: (id: string, payload: Partial<{ name: string; description?: string }>) =>
    apiClient.request<Department>({
      path: endpoints.departments.byId(id),
      method: "PATCH",
      body: payload,
    }),

  remove: (id: string) =>
    apiClient.request<void>({
      path: endpoints.departments.byId(id),
      method: "DELETE",
    }),
};
