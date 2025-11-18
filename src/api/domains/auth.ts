import { apiClient } from "../apiClient";
import type { AuthResponse, User } from "../types";

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.request<AuthResponse>({
      path: "/v1/auth/login",
      method: "POST",
      body: payload,
    }),

  me: () =>
    apiClient.request<User>({
      path: "/v1/auth/me",
      method: "GET",
    }),

  logout: () =>
    apiClient.request<void>({
      path: "/v1/auth/logout",
      method: "POST",
    }),
};
