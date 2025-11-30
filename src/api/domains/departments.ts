import { apiClient } from "../apiClient";
import type { Department, PaginatedResponse, PaginationParams } from "../types";

export const departmentsApi = {
  list: (params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<Department>>({
      path: "/v1/departments",
      method: "GET",
      query: params,
    }),

  create: (payload: { name: string; description?: string }) =>
    apiClient.request<Department>({
      path: "/v1/departments",
      method: "POST",
      body: payload,
    }),

  getById: (id: string) =>
    apiClient.request<Department>({
      path: `/v1/departments/${id}`,
      method: "GET",
    }),

  update: (id: string, payload: Partial<{ name: string; description?: string }>) =>
    apiClient.request<Department>({
      path: `/v1/departments/${id}`,
      method: "PATCH",
      body: payload,
    }),

  remove: (id: string) =>
    apiClient.request<void>({
      path: `/v1/departments/${id}`,
      method: "DELETE",
    }),
};
