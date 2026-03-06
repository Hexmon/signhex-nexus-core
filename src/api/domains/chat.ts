import { ApiError, apiClient } from "@/api/apiClient";
import { endpoints } from "@/api/endpoints";
import type {
  ChatConversationResponse,
  ChatInvitePolicy,
  ChatListConversationsResponse,
  ChatListMessagesResponse,
  ChatMarkReadResponse,
  ChatModerationResponse,
  ChatNormalizedError,
  ChatReactionsResponse,
  ChatSendMessageResponse,
  ChatThreadResponse,
  ChatUpdateMessageResponse,
  ChatDeleteMessageResponse,
  ChatConversationType,
} from "@/api/types";

export interface ChatCursorParams {
  afterSeq?: number;
  limit?: number;
}

export interface CreateChatConversationInput {
  type: Exclude<ChatConversationType, "DM">;
  title?: string;
  topic?: string;
  purpose?: string;
  members?: string[];
  invite_policy?: ChatInvitePolicy;
}

export interface SendChatMessageInput {
  conversationId: string;
  text?: string;
  replyTo?: string | null;
  attachmentMediaIds?: string[];
}

export interface UpdateChatConversationInput {
  title?: string | null;
  topic?: string | null;
  purpose?: string | null;
  invite_policy?: ChatInvitePolicy;
  state?: "ACTIVE" | "ARCHIVED" | "DELETED";
}

export interface ChatModerationInput {
  userId: string;
  action: "MUTE" | "UNMUTE" | "BAN" | "UNBAN";
  until?: string;
  reason?: string;
}

const withCursorDefaults = (params?: ChatCursorParams) => ({
  afterSeq: params?.afterSeq ?? 0,
  limit: params?.limit ?? 50,
});

export const normalizeChatError = (error: unknown): ChatNormalizedError => {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      httpStatus: error.status,
      traceId: error.traceId,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: "Request failed. Please try again.",
  };
};

export const chatApi = {
  createDm: (otherUserId: string) =>
    apiClient.request<ChatConversationResponse>({
      path: endpoints.chat.dm,
      method: "POST",
      body: { otherUserId },
    }),

  createConversation: (payload: CreateChatConversationInput) =>
    apiClient.request<ChatConversationResponse>({
      path: endpoints.chat.conversations,
      method: "POST",
      body: payload,
    }),

  listConversations: () =>
    apiClient.request<ChatListConversationsResponse>({
      path: endpoints.chat.conversations,
      method: "GET",
    }),

  listMessages: (conversationId: string, params?: ChatCursorParams) =>
    apiClient.request<ChatListMessagesResponse>({
      path: endpoints.chat.messages(conversationId),
      method: "GET",
      query: withCursorDefaults(params),
    }),

  listThread: (conversationId: string, parentMessageId: string, params?: ChatCursorParams) =>
    apiClient.request<ChatThreadResponse>({
      path: endpoints.chat.thread(conversationId, parentMessageId),
      method: "GET",
      query: withCursorDefaults(params),
    }),

  sendMessage: ({ conversationId, text, replyTo, attachmentMediaIds }: SendChatMessageInput) =>
    apiClient.request<ChatSendMessageResponse>({
      path: endpoints.chat.messages(conversationId),
      method: "POST",
      body: {
        text,
        replyTo: replyTo ?? undefined,
        attachmentMediaIds: attachmentMediaIds ?? [],
      },
    }),

  editMessage: (messageId: string, text: string) =>
    apiClient.request<ChatUpdateMessageResponse>({
      path: endpoints.chat.messageById(messageId),
      method: "PATCH",
      body: { text },
    }),

  deleteMessage: (messageId: string) =>
    apiClient.request<ChatDeleteMessageResponse>({
      path: endpoints.chat.messageById(messageId),
      method: "DELETE",
    }),

  reactToMessage: (messageId: string, payload: { emoji: string; op: "add" | "remove" }) =>
    apiClient.request<ChatReactionsResponse>({
      path: endpoints.chat.reactions(messageId),
      method: "POST",
      body: payload,
    }),

  markRead: (conversationId: string, lastReadSeq: number) =>
    apiClient.request<ChatMarkReadResponse>({
      path: endpoints.chat.read(conversationId),
      method: "POST",
      body: { lastReadSeq },
    }),

  inviteMembers: (conversationId: string, userIds: string[]) =>
    apiClient.request<{ success: boolean }>({
      path: endpoints.chat.invite(conversationId),
      method: "POST",
      body: { userIds },
    }),

  removeMember: (conversationId: string, userId: string) =>
    apiClient.request<{ success: boolean }>({
      path: endpoints.chat.removeMember(conversationId),
      method: "POST",
      body: { userId },
    }),

  updateConversation: (conversationId: string, payload: UpdateChatConversationInput) =>
    apiClient.request<ChatConversationResponse>({
      path: endpoints.chat.updateConversation(conversationId),
      method: "PATCH",
      body: payload,
    }),

  archiveConversation: (conversationId: string) =>
    apiClient.request<ChatConversationResponse>({
      path: endpoints.chat.archiveConversation(conversationId),
      method: "POST",
    }),

  unarchiveConversation: (conversationId: string) =>
    apiClient.request<ChatConversationResponse>({
      path: endpoints.chat.unarchiveConversation(conversationId),
      method: "POST",
    }),

  deleteConversation: (conversationId: string) =>
    apiClient.request<{ success: boolean; conversationId?: string }>({
      path: endpoints.chat.deleteConversation(conversationId),
      method: "DELETE",
    }),

  moderateConversation: (conversationId: string, payload: ChatModerationInput) =>
    apiClient.request<ChatModerationResponse>({
      path: endpoints.chat.moderateConversation(conversationId),
      method: "POST",
      body: payload,
    }),
};
