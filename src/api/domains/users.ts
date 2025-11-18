import { apiClient } from "../apiClient";
import type { PaginatedResponse, PaginationParams, User } from "../types";

export interface InviteUserPayload {
  email: string;
  role: User["role"];
  department_id?: string;
}

export const usersApi = {
  invite: (payload: InviteUserPayload) =>
    apiClient.request<{ invite_token: string; invite_expires_at?: string; temp_password: string }>({
      path: "/v1/users/invite",
      method: "POST",
      body: payload,
      useApiKey: true,
    }),

  activate: (payload: { token: string; password: string }) =>
    apiClient.request<void>({
      path: "/v1/users/activate",
      method: "POST",
      body: payload,
    }),

  resetPassword: (userId: string) =>
    apiClient.request<{ temp_password: string }>({
      path: `/v1/users/${userId}/reset-password`,
      method: "POST",
      useApiKey: true,
    }),

  list: (params?: PaginationParams & { role?: string; department_id?: string; is_active?: boolean }) =>
    apiClient.request<PaginatedResponse<User>>({
      path: "/v1/users",
      method: "GET",
      query: params,
      useApiKey: true,
    }),
};
