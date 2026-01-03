import { apiClient } from "../apiClient";
import type { PaginatedResponse, PaginationParams, User } from "../types";

export interface InviteUserPayload {
  email: string;
  role: User["role"];
  department_id?: string;
}

export interface UserInvitation {
  id: string;
  email?: string;
  role?: User["role"];
  invited_at?: string;
  expires_at?: string;
  status?: string;
}

export const usersApi = {
  create: (payload: { email: string; role: User["role"]; department_id?: string; password?: string }) =>
    apiClient.request<User>({
      path: "/users",
      method: "POST",
      body: payload,
    }),

  invite: (payload: InviteUserPayload) =>
    apiClient.request<{ invite_token: string; invite_expires_at?: string; temp_password: string }>({
      path: "/users/invite",
      method: "POST",
      body: payload,
    }),

  listInvitations: (params?: PaginationParams & { status?: string; email?: string; invited_after?: string }) =>
    apiClient.request<PaginatedResponse<UserInvitation>>({
      path: "/users/invite",
      method: "GET",
      query: params,
    }),

  activate: (payload: { token: string; password: string }) =>
    apiClient.request<void>({
      path: "/users/activate",
      method: "POST",
      body: payload,
    }),

  resetPassword: (userId: string) =>
    apiClient.request<{ temp_password: string }>({
      path: `/users/${userId}/reset-password`,
      method: "POST",
    }),

  list: (params?: PaginationParams & { role?: string; department_id?: string; is_active?: boolean }) =>
    apiClient.request<PaginatedResponse<User>>({
      path: "/users",
      method: "GET",
      query: params,
    }),

  getById: (userId: string) =>
    apiClient.request<User>({
      path: `/users/${userId}`,
      method: "GET",
    }),

  update: (userId: string, payload: Partial<User>) =>
    apiClient.request<User>({
      path: `/users/${userId}`,
      method: "PATCH",
      body: payload,
    }),

  remove: (userId: string) =>
    apiClient.request<void>({
      path: `/users/${userId}`,
      method: "DELETE",
    }),
};
