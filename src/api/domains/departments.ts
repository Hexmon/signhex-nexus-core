import { apiClient } from "../apiClient";
import type { Department, PaginatedResponse, PaginationParams } from "../types";

export const departmentsApi = {
  list: (params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<Department>>({
      path: "/departments",
      method: "GET",
      query: params,
    }),

  create: (payload: { name: string; description?: string }) =>
    apiClient.request<Department>({
      path: "/departments",
      method: "POST",
      body: payload,
    }),

  getById: (id: string) =>
    apiClient.request<Department>({
      path: `/departments/${id}`,
      method: "GET",
    }),

  update: (id: string, payload: Partial<{ name: string; description?: string }>) =>
    apiClient.request<Department>({
      path: `/departments/${id}`,
      method: "PATCH",
      body: payload,
    }),

  remove: (id: string) =>
    apiClient.request<void>({
      path: `/departments/${id}`,
      method: "DELETE",
    }),
};
