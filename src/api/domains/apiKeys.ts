import { apiClient } from "../apiClient";
import type { ApiKey } from "../types";

export interface CreateApiKeyPayload {
  name: string;
  scopes?: string[];
  roles?: string[];
  expires_at?: string | null;
}

export const apiKeysApi = {
  create: (payload: CreateApiKeyPayload) =>
    apiClient.request<ApiKey>({
      path: "/v1/api-keys",
      method: "POST",
      body: payload,
      useApiKey: true,
    }),

  list: () =>
    apiClient.request<ApiKey[]>({
      path: "/v1/api-keys",
      method: "GET",
      useApiKey: true,
    }),

  rotate: (apiKeyId: string) =>
    apiClient.request<ApiKey>({
      path: `/v1/api-keys/${apiKeyId}/rotate`,
      method: "POST",
      useApiKey: true,
    }),

  revoke: (apiKeyId: string) =>
    apiClient.request<void>({
      path: `/v1/api-keys/${apiKeyId}/revoke`,
      method: "POST",
      useApiKey: true,
    }),
};
