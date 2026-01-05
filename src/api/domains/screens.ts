import { apiClient } from "../apiClient";
import { endpoints } from "../endpoints";
import type { PaginatedResponse, PaginationParams, Screen, ScreenGroup } from "../types";

export const screensApi = {
  list: (params?: PaginationParams & { status?: string }) =>
    apiClient.request<PaginatedResponse<Screen>>({
      path: endpoints.screens.base,
      method: "GET",
      query: params,
    }),

  getById: (screenId: string) =>
    apiClient.request<Screen>({
      path: endpoints.screens.byId(screenId),
      method: "GET",
    }),

  create: (payload: { name: string; location?: string }) =>
    apiClient.request<Screen>({
      path: endpoints.screens.base,
      method: "POST",
      body: payload,
    }),

  update: (id: string, payload: Partial<{ name: string; location?: string; status?: string }>) =>
    apiClient.request<Screen>({
      path: endpoints.screens.byId(id),
      method: "PATCH",
      body: payload,
    }),

  remove: (id: string) =>
    apiClient.request<void>({
      path: endpoints.screens.byId(id),
      method: "DELETE",
    }),

  createGroup: (payload: { name: string; description?: string }) =>
    apiClient.request<ScreenGroup>({
      path: endpoints.screens.groups,
      method: "POST",
      body: payload,
    }),

  listGroups: () =>
    apiClient.request<ScreenGroup[]>({
      path: endpoints.screens.groups,
      method: "GET",
    }),

  updateGroup: (groupId: string, payload: Partial<{ name: string; description?: string }>) =>
    apiClient.request<ScreenGroup>({
      path: endpoints.screens.groupById(groupId),
      method: "PATCH",
      body: payload,
    }),

  removeGroup: (groupId: string) =>
    apiClient.request<void>({
      path: endpoints.screens.groupById(groupId),
      method: "DELETE",
    }),
};
