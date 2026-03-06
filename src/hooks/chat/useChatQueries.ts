import { useMemo } from "react";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  chatApi,
  type ChatCursorParams,
  type CreateChatConversationInput,
  type SendChatMessageInput,
  type ChatModerationInput,
  type UpdateChatConversationInput,
} from "@/api/domains/chat";
import { usersApi } from "@/api/domains/users";
import type {
  ChatConversationListItem,
  ChatListMessagesResponse,
  ChatMessage,
  ChatThreadResponse,
  User,
} from "@/api/types";

const DEFAULT_LIMIT = 50;

export const chatQueryKeys = {
  conversations: ["chat", "conversations"] as const,
  usersDirectory: ["chat", "users-directory"] as const,
  messages: (conversationId?: string, afterSeq = 0, limit = DEFAULT_LIMIT) =>
    ["chat", "messages", conversationId, afterSeq, limit] as const,
  thread: (conversationId?: string, threadRootId?: string, afterSeq = 0, limit = DEFAULT_LIMIT) =>
    ["chat", "thread", conversationId, threadRootId, afterSeq, limit] as const,
};

const dedupeMessages = (items: ChatMessage[]) => {
  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  return deduped.sort((a, b) => a.seq - b.seq);
};

const flattenMessagePages = (pages?: Array<{ items: ChatMessage[] }>) =>
  dedupeMessages((pages ?? []).flatMap((page) => page.items ?? []));

const patchMessageList = (
  list: ChatMessage[],
  messageId: string,
  patch: Partial<ChatMessage>,
) =>
  list.map((item) => (item.id === messageId ? { ...item, ...patch } : item));

const patchMessageInInfiniteData = (
  data: InfiniteData<ChatListMessagesResponse> | InfiniteData<ChatThreadResponse> | undefined,
  messageId: string,
  patch: Partial<ChatMessage>,
) => {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: patchMessageList(page.items ?? [], messageId, patch),
    })),
  };
};

const appendMessageInInfiniteData = <T extends { items: ChatMessage[] }>(
  data: InfiniteData<T> | undefined,
  message: ChatMessage,
): InfiniteData<T> | undefined => {
  if (!data) return data;
  if (data.pages.length === 0) return data;

  const pages = [...data.pages];
  const lastPage = pages[pages.length - 1];
  const merged = dedupeMessages([...(lastPage.items ?? []), message]);
  pages[pages.length - 1] = { ...lastPage, items: merged };
  return { ...data, pages };
};

const findLatestSeq = (items: ChatMessage[]) =>
  items.length ? Math.max(...items.map((item) => item.seq ?? 0)) : 0;

export const useChatConversationsList = () =>
  useQuery({
    queryKey: chatQueryKeys.conversations,
    queryFn: chatApi.listConversations,
    staleTime: 20_000,
  });

export const useConversationSettings = (conversationId?: string) => {
  const conversationsQuery = useChatConversationsList();
  const conversation = useMemo<ChatConversationListItem | undefined>(
    () => conversationsQuery.data?.items?.find((item) => item.id === conversationId),
    [conversationId, conversationsQuery.data?.items],
  );

  return {
    ...conversationsQuery,
    conversation,
  };
};

export const useChatUserDirectory = (enabled = true) =>
  useQuery({
    queryKey: chatQueryKeys.usersDirectory,
    enabled,
    staleTime: 120_000,
    queryFn: async () => {
      const response = await usersApi.list({ page: 1, limit: 500, is_active: true });
      const users = response.items ?? [];
      const byId = users.reduce<Record<string, User>>((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
      return {
        users,
        byId,
      };
    },
  });

export const useChatMessages = (conversationId?: string, params?: ChatCursorParams) => {
  const limit = params?.limit ?? DEFAULT_LIMIT;
  const afterSeq = params?.afterSeq ?? 0;

  const query = useInfiniteQuery({
    queryKey: chatQueryKeys.messages(conversationId, afterSeq, limit),
    enabled: Boolean(conversationId),
    initialPageParam: afterSeq,
    queryFn: ({ pageParam }) =>
      chatApi.listMessages(conversationId!, {
        afterSeq: Number(pageParam ?? 0),
        limit,
      }),
    getNextPageParam: (lastPage) => {
      const lastSeq = lastPage.items?.length
        ? lastPage.items[lastPage.items.length - 1].seq
        : undefined;
      if (!lastSeq || (lastPage.items?.length ?? 0) < limit) return undefined;
      return lastSeq;
    },
  });

  const items = useMemo(() => flattenMessagePages(query.data?.pages), [query.data?.pages]);
  const latestSeq = useMemo(() => findLatestSeq(items), [items]);

  return {
    ...query,
    items,
    latestSeq,
  };
};

export const useChatThread = (
  conversationId?: string,
  threadRootId?: string,
  params?: ChatCursorParams,
) => {
  const limit = params?.limit ?? DEFAULT_LIMIT;
  const afterSeq = params?.afterSeq ?? 0;

  const query = useInfiniteQuery({
    queryKey: chatQueryKeys.thread(conversationId, threadRootId, afterSeq, limit),
    enabled: Boolean(conversationId && threadRootId),
    initialPageParam: afterSeq,
    queryFn: ({ pageParam }) =>
      chatApi.listThread(conversationId!, threadRootId!, {
        afterSeq: Number(pageParam ?? 0),
        limit,
      }),
    getNextPageParam: (lastPage) => {
      const lastSeq = lastPage.items?.length
        ? lastPage.items[lastPage.items.length - 1].seq
        : undefined;
      if (!lastSeq || (lastPage.items?.length ?? 0) < limit) return undefined;
      return lastSeq;
    },
  });

  const items = useMemo(() => flattenMessagePages(query.data?.pages), [query.data?.pages]);
  const latestSeq = useMemo(() => findLatestSeq(items), [items]);

  return {
    ...query,
    items,
    latestSeq,
  };
};

const patchMessageCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  messageId: string,
  patch: Partial<ChatMessage>,
) => {
  queryClient.setQueriesData(
    { queryKey: ["chat", "messages", conversationId] },
    (current: InfiniteData<ChatListMessagesResponse> | undefined) =>
      patchMessageInInfiniteData(current, messageId, patch),
  );
  queryClient.setQueriesData(
    { queryKey: ["chat", "thread", conversationId] },
    (current: InfiniteData<ChatThreadResponse> | undefined) =>
      patchMessageInInfiniteData(current, messageId, patch),
  );
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendChatMessageInput) => chatApi.sendMessage(payload),
    onSuccess: (response, payload) => {
      const message = response.message;

      queryClient.setQueriesData(
        { queryKey: ["chat", "messages", payload.conversationId] },
        (current: InfiniteData<ChatListMessagesResponse> | undefined) =>
          appendMessageInInfiniteData(current, message),
      );

      if (message.thread_root_id) {
        queryClient.setQueriesData(
          { queryKey: ["chat", "thread", payload.conversationId, message.thread_root_id] },
          (current: InfiniteData<ChatThreadResponse> | undefined) =>
            appendMessageInInfiniteData(current, message),
        );
      }

      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};

export const useEditChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, text, conversationId }: { messageId: string; text: string; conversationId: string }) =>
      chatApi.editMessage(messageId, text).then((res) => ({ ...res, conversationId })),
    onSuccess: ({ message, conversationId }) => {
      patchMessageCaches(queryClient, conversationId, message.id, message);
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};

export const useDeleteChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, conversationId }: { messageId: string; conversationId: string }) =>
      chatApi.deleteMessage(messageId).then((res) => ({ ...res, conversationId })),
    onSuccess: ({ message, conversationId }) => {
      patchMessageCaches(queryClient, conversationId, message.id, message);
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};

export const useReactToMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      conversationId,
      emoji,
      op,
    }: {
      messageId: string;
      conversationId: string;
      emoji: string;
      op: "add" | "remove";
    }) =>
      chatApi.reactToMessage(messageId, { emoji, op }).then((res) => ({
        ...res,
        messageId,
        conversationId,
      })),
    onSuccess: ({ reactions, messageId, conversationId }) => {
      patchMessageCaches(queryClient, conversationId, messageId, { reactions });
    },
  });
};

export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, lastReadSeq }: { conversationId: string; lastReadSeq: number }) =>
      chatApi.markRead(conversationId, lastReadSeq),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};

export const useCreateDm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: string) => chatApi.createDm(otherUserId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};

export const useCreateChatConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChatConversationInput) => chatApi.createConversation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};

export const useInviteChatMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, userIds }: { conversationId: string; userIds: string[] }) =>
      chatApi.inviteMembers(conversationId, userIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};

export const useRemoveChatMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      chatApi.removeMember(conversationId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};

export const useUpdateConversationSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      payload,
    }: {
      conversationId: string;
      payload: UpdateChatConversationInput;
    }) => chatApi.updateConversation(conversationId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};

export const useArchiveConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chatApi.archiveConversation(conversationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};

export const useUnarchiveConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chatApi.unarchiveConversation(conversationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chatApi.deleteConversation(conversationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};

export const useModerateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      payload,
    }: {
      conversationId: string;
      payload: ChatModerationInput;
    }) => chatApi.moderateConversation(conversationId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    },
  });
};
