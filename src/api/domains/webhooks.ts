import { apiClient } from "../apiClient";
import type { Webhook } from "../types";

export interface CreateWebhookPayload {
  name: string;
  event_types: string[];
  target_url: string;
  headers?: Record<string, string>;
  is_active?: boolean;
}

export const webhooksApi = {
  create: (payload: CreateWebhookPayload) =>
    apiClient.request<Webhook>({
      path: "/v1/webhooks",
      method: "POST",
      body: payload,
    }),

  list: () =>
    apiClient.request<Webhook[]>({
      path: "/v1/webhooks",
      method: "GET",
    }),

  update: (webhookId: string, payload: Partial<CreateWebhookPayload>) =>
    apiClient.request<Webhook>({
      path: `/v1/webhooks/${webhookId}`,
      method: "PATCH",
      body: payload,
    }),

  remove: (webhookId: string) =>
    apiClient.request<void>({
      path: `/v1/webhooks/${webhookId}`,
      method: "DELETE",
    }),

  test: (webhookId: string) =>
    apiClient.request<void>({
      path: `/v1/webhooks/${webhookId}/test`,
      method: "POST",
    }),
};
