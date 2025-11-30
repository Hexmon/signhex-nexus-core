import { apiClient } from "../apiClient";
import type { Notification, PaginatedResponse, PaginationParams } from "../types";

export const notificationsApi = {
  list: (params?: PaginationParams & { read?: boolean }) =>
    apiClient.request<PaginatedResponse<Notification>>({
      path: "/v1/notifications",
      method: "GET",
      query: params,
    }),

  getById: (notificationId: string) =>
    apiClient.request<Notification>({
      path: `/v1/notifications/${notificationId}`,
      method: "GET",
    }),

  markRead: (notificationId: string) =>
    apiClient.request<void>({
      path: `/v1/notifications/${notificationId}/read`,
      method: "POST",
    }),

  markAllRead: () =>
    apiClient.request<void>({
      path: "/v1/notifications/read-all",
      method: "POST",
    }),

  remove: (notificationId: string) =>
    apiClient.request<void>({
      path: `/v1/notifications/${notificationId}`,
      method: "DELETE",
    }),
};
