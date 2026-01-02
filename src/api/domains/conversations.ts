import { apiClient } from "../apiClient";
import type { Conversation, ConversationMessage, PaginationParams, PaginatedResponse } from "../types";

export const conversationsApi = {
  start: (participant_id: string) =>
    apiClient.request<Conversation>({
      path: "/conversations",
      method: "POST",
      body: { participant_id },
    }),

  list: () =>
    apiClient.request<Conversation[]>({
      path: "/conversations",
      method: "GET",
    }),

  listMessages: (conversationId: string, params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<ConversationMessage>>({
      path: `/conversations/${conversationId}/messages`,
      method: "GET",
      query: params,
    }),

  sendMessage: (
    conversationId: string,
    payload: { content: string; attachments?: string[] },
  ) =>
    apiClient.request<ConversationMessage>({
      path: `/conversations/${conversationId}/messages`,
      method: "POST",
      body: payload,
    }),

  markRead: (conversationId: string) =>
    apiClient.request<void>({
      path: `/conversations/${conversationId}/read`,
      method: "POST",
    }),
};
