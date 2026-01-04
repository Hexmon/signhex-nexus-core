import { apiClient } from "../apiClient";
import type {
  PaginatedResponse,
  PaginationParams,
  Screen,
  ScreenGroup,
  ScreenStatus,
  NowPlaying,
  ScreenAvailability,
  ScreenSnapshot,
  ScreenGroupAvailability,
  ScreenGroupNowPlaying,
  ScreensOverview,
} from "../types";

export const screensApi = {
  // Screens
  list: (params?: PaginationParams & { status?: string }) =>
    apiClient.request<PaginatedResponse<Screen>>({
      path: "/screens",
      method: "GET",
      query: params,
    }),

  getById: (screenId: string) =>
    apiClient.request<Screen>({
      path: `/screens/${screenId}`,
      method: "GET",
    }),

  create: (payload: { name: string; location?: string }) =>
    apiClient.request<Screen>({
      path: "/screens",
      method: "POST",
      body: payload,
    }),

  update: (id: string, payload: Partial<{ name: string; location?: string; is_active?: boolean }>) =>
    apiClient.request<Screen>({
      path: `/screens/${id}`,
      method: "PATCH",
      body: payload,
    }),

  remove: (id: string) =>
    apiClient.request<void>({
      path: `/screens/${id}`,
      method: "DELETE",
    }),

  getOverview: () =>
    apiClient.request<ScreensOverview>({
      path: "/screens/overview",
      method: "GET",
    }),

  getStatus: (screenId: string) =>
    apiClient.request<ScreenStatus>({
      path: `/screens/${screenId}/status`,
      method: "GET",
    }),

  getNowPlaying: (screenId: string) =>
    apiClient.request<NowPlaying>({
      path: `/screens/${screenId}/now-playing`,
      method: "GET",
    }),

  getAvailability: (screenId: string) =>
    apiClient.request<ScreenAvailability>({
      path: `/screens/${screenId}/availability`,
      method: "GET",
    }),

  getSnapshot: (screenId: string, includeUrls = true) =>
    apiClient.request<ScreenSnapshot>({
      path: `/screens/${screenId}/snapshot`,
      method: "GET",
      query: { include_urls: includeUrls },
    }),

  // Screen Groups
  createGroup: (payload: { name: string; description?: string; screen_ids?: string[] }) =>
    apiClient.request<ScreenGroup>({
      path: "/screen-groups",
      method: "POST",
      body: payload,
    }),

  listGroups: (params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<ScreenGroup>>({
      path: "/screen-groups",
      method: "GET",
      query: params,
    }),

  getGroupById: (groupId: string) =>
    apiClient.request<ScreenGroup>({
      path: `/screen-groups/${groupId}`,
      method: "GET",
    }),

  updateGroup: (groupId: string, payload: Partial<{ name?: string; description?: string; screen_ids?: string[] }>) =>
    apiClient.request<ScreenGroup>({
      path: `/screen-groups/${groupId}`,
      method: "PATCH",
      body: payload,
    }),

  removeGroup: (groupId: string) =>
    apiClient.request<void>({
      path: `/screen-groups/${groupId}`,
      method: "DELETE",
    }),

  getGroupAvailability: (groupId: string) =>
    apiClient.request<ScreenGroupAvailability>({
      path: `/screen-groups/${groupId}/availability`,
      method: "GET",
    }),

  getGroupNowPlaying: (groupId: string) =>
    apiClient.request<ScreenGroupNowPlaying>({
      path: `/screen-groups/${groupId}/now-playing`,
      method: "GET",
    }),

  listAvailableScreens: (params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<Screen>>({
      path: "/screens",
      method: "GET",
      query: params,
    }),
};