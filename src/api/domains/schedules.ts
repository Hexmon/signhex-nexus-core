import { apiClient } from "../apiClient";
import type { PaginatedResponse, PaginationParams, Publish, Schedule } from "../types";

export interface SchedulePayload {
  name: string;
  description?: string;
  start_at: string;
  end_at: string;
  is_active?: boolean;
}

export const schedulesApi = {
  create: (payload: SchedulePayload) =>
    apiClient.request<Schedule>({
      path: "/v1/schedules",
      method: "POST",
      body: payload,
    }),

  update: (scheduleId: string, payload: Partial<SchedulePayload>) =>
    apiClient.request<Schedule>({
      path: `/v1/schedules/${scheduleId}`,
      method: "PATCH",
      body: payload,
    }),

  list: (params?: PaginationParams & { is_active?: boolean }) =>
    apiClient.request<PaginatedResponse<Schedule>>({
      path: "/v1/schedules",
      method: "GET",
      query: params,
    }),

  publish: (
    scheduleId: string,
    payload: { screen_ids?: string[]; screen_group_ids?: string[] },
  ) =>
    apiClient.request<Publish>({
      path: `/v1/schedules/${scheduleId}/publish`,
      method: "POST",
      body: payload,
    }),

  getPublish: (publishId: string) =>
    apiClient.request<Publish>({
      path: `/v1/publishes/${publishId}`,
      method: "GET",
    }),

  listPublishes: (scheduleId: string) =>
    apiClient.request<Publish[]>({
      path: `/v1/schedules/${scheduleId}/publishes`,
      method: "GET",
    }),

  updateTarget: (
    publishId: string,
    targetId: string,
    payload: { status: string; error?: string | null },
  ) =>
    apiClient.request<Publish>({
      path: `/v1/publishes/${publishId}/targets/${targetId}`,
      method: "PATCH",
      body: payload,
    }),
};
