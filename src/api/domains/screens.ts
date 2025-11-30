import { apiClient } from "../apiClient";
import type { PaginatedResponse, PaginationParams, Screen, ScreenGroup } from "../types";

export const screensApi = {
  list: (params?: PaginationParams & { status?: string }) =>
    apiClient.request<PaginatedResponse<Screen>>({
      path: "/v1/screens",
      method: "GET",
      query: params,
    }),

  getById: (screenId: string) =>
    apiClient.request<Screen>({
      path: `/v1/screens/${screenId}`,
      method: "GET",
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

  remove: (id: string) =>
    apiClient.request<void>({
      path: `/v1/screens/${id}`,
      method: "DELETE",
    }),

  createGroup: (payload: { name: string; description?: string }) =>
    apiClient.request<ScreenGroup>({
      path: "/v1/screen-groups",
      method: "POST",
      body: payload,
    }),

  listGroups: () =>
    apiClient.request<ScreenGroup[]>({
      path: "/v1/screen-groups",
      method: "GET",
    }),

  updateGroup: (groupId: string, payload: Partial<{ name: string; description?: string }>) =>
    apiClient.request<ScreenGroup>({
      path: `/v1/screen-groups/${groupId}`,
      method: "PATCH",
      body: payload,
    }),

  removeGroup: (groupId: string) =>
    apiClient.request<void>({
      path: `/v1/screen-groups/${groupId}`,
      method: "DELETE",
    }),
};
