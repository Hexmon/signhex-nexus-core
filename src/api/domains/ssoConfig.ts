import { apiClient } from "../apiClient";
import type { SsoConfig } from "../types";

export interface UpsertSsoPayload
  extends Omit<SsoConfig, "id" | "is_active"> {
  is_active?: boolean;
}

export const ssoApi = {
  upsert: (payload: UpsertSsoPayload) =>
    apiClient.request<SsoConfig>({
      path: "/v1/sso-config",
      method: "POST",
      body: payload,
    }),

  getActive: () =>
    apiClient.request<SsoConfig | null>({
      path: "/v1/sso-config",
      method: "GET",
    }),

  deactivate: (id: string) =>
    apiClient.request<void>({
      path: `/v1/sso-config/${id}/deactivate`,
      method: "POST",
    }),
};
