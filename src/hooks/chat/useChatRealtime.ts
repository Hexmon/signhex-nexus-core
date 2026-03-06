import { useEffect, useMemo, useRef, useState } from "react";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/api/domains/chat";
import type {
  ChatConversationUpdatedEvent,
  ChatListMessagesResponse,
  ChatMessage,
  ChatMessageDeletedEvent,
  ChatMessageNewEvent,
  ChatSubscribeAck,
  ChatMessageUpdatedEvent,
  ChatThreadResponse,
  ChatTypingEvent,
} from "@/api/types";
import { chatQueryKeys } from "@/hooks/chat/useChatQueries";
import { connectChatSocket } from "@/lib/chatSocket";
import { useAppSelector } from "@/store/hooks";

interface UseChatRealtimeOptions {
  activeConversationId?: string;
  subscribedConversationIds?: string[];
  onActiveConversationRejected?: (conversationId: string) => void;
}

const normalizeMessageList = (items: ChatMessage[]) => {
  const dedupedMap = new Map<string, ChatMessage>();
  items.forEach((item) => {
    dedupedMap.set(item.id, item);
  });
  return Array.from(dedupedMap.values()).sort((a, b) => a.seq - b.seq);
};

const appendMessageData = <T extends { items: ChatMessage[] }>(
  current: InfiniteData<T> | undefined,
  message: ChatMessage,
): InfiniteData<T> | undefined => {
  if (!current) return current;
  if (current.pages.length === 0) return current;

  const pages = [...current.pages];
  const lastPage = pages[pages.length - 1];
  pages[pages.length - 1] = {
    ...lastPage,
    items: normalizeMessageList([...(lastPage.items ?? []), message]),
  };
  return { ...current, pages };
};

const patchMessageData = <T extends { items: ChatMessage[] }>(
  current: InfiniteData<T> | undefined,
  messageId: string,
  patch: Partial<ChatMessage>,
): InfiniteData<T> | undefined => {
  if (!current) return current;
  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (item.id === messageId ? { ...item, ...patch } : item)),
    })),
  };
};

const getLastSeenSeqFromCache = (queryClient: ReturnType<typeof useQueryClient>, conversationId: string) => {
  const entries = queryClient.getQueriesData({
    queryKey: ["chat", "messages", conversationId],
  });

  let maxSeq = 0;
  entries.forEach((entry) => {
    const value = entry[1] as InfiniteData<ChatListMessagesResponse> | undefined;
    const pages = value?.pages ?? [];
    pages.forEach((page) => {
      page.items?.forEach((item) => {
        if (item.seq > maxSeq) maxSeq = item.seq;
      });
    });
  });

  return maxSeq;
};

const normalizeRejectedIds = (ack?: Partial<ChatSubscribeAck> | null) => {
  if (!ack || !Array.isArray(ack.rejected)) return [] as string[];
  return ack.rejected
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object" && "conversationId" in entry) {
        const value = (entry as { conversationId?: unknown }).conversationId;
        return typeof value === "string" ? value : undefined;
      }
      return undefined;
    })
    .filter((value): value is string => Boolean(value));
};

export const useChatRealtime = ({
  activeConversationId,
  subscribedConversationIds = [],
  onActiveConversationRejected,
}: UseChatRealtimeOptions) => {
  const queryClient = useQueryClient();
  const authToken = useAppSelector((state) => state.auth.token);
  const selfUserId = useAppSelector((state) => state.auth.user?.id);
  const [isConnected, setIsConnected] = useState(false);
  const [typingMap, setTypingMap] = useState<Record<string, string[]>>({});
  const [rejectedConversationIds, setRejectedConversationIds] = useState<string[]>([]);
  const typingTimeoutRef = useRef<Record<string, number>>({});

  const subscriptionIds = useMemo(() => {
    const ids = new Set<string>();
    subscribedConversationIds.forEach((id) => id && ids.add(id));
    if (activeConversationId) ids.add(activeConversationId);
    return Array.from(ids);
  }, [activeConversationId, subscribedConversationIds]);

  useEffect(() => {
    if (!authToken) return;
    const socket = connectChatSocket(authToken);
    if (!socket) return;

    const subscribe = () => {
      if (subscriptionIds.length === 0) return;
      socket.emit("chat:subscribe", { conversationIds: subscriptionIds }, (ack?: ChatSubscribeAck) => {
        const rejectedIds = normalizeRejectedIds(ack);
        setRejectedConversationIds(rejectedIds);
        if (activeConversationId && rejectedIds.includes(activeConversationId)) {
          onActiveConversationRejected?.(activeConversationId);
        }
      });
    };

    const onConnect = () => {
      setIsConnected(true);
      subscribe();
    };
    const onDisconnect = () => setIsConnected(false);

    const onMessageNew = (payload: ChatMessageNewEvent) => {
      queryClient.setQueriesData(
        { queryKey: ["chat", "messages", payload.conversationId] },
        (current: InfiniteData<ChatListMessagesResponse> | undefined) =>
          appendMessageData(current, payload.message),
      );

      if (payload.message.thread_root_id) {
        queryClient.setQueriesData(
          { queryKey: ["chat", "thread", payload.conversationId, payload.message.thread_root_id] },
          (current: InfiniteData<ChatThreadResponse> | undefined) =>
            appendMessageData(current, payload.message),
        );
      }

      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
    };

    const onMessageUpdated = (payload: ChatMessageUpdatedEvent) => {
      queryClient.setQueriesData(
        { queryKey: ["chat", "messages", payload.conversationId] },
        (current: InfiniteData<ChatListMessagesResponse> | undefined) =>
          patchMessageData(current, payload.messageId, payload.patch),
      );
      queryClient.setQueriesData(
        { queryKey: ["chat", "thread", payload.conversationId] },
        (current: InfiniteData<ChatThreadResponse> | undefined) =>
          patchMessageData(current, payload.messageId, payload.patch),
      );
    };

    const onMessageDeleted = (payload: ChatMessageDeletedEvent) => {
      const tombstonePatch: Partial<ChatMessage> = {
        deleted_at: new Date().toISOString(),
        body_text: null,
        body_rich: null,
        attachments: [],
        reactions: [],
      };
      queryClient.setQueriesData(
        { queryKey: ["chat", "messages", payload.conversationId] },
        (current: InfiniteData<ChatListMessagesResponse> | undefined) =>
          patchMessageData(current, payload.messageId, tombstonePatch),
      );
      queryClient.setQueriesData(
        { queryKey: ["chat", "thread", payload.conversationId] },
        (current: InfiniteData<ChatThreadResponse> | undefined) =>
          patchMessageData(current, payload.messageId, tombstonePatch),
      );
    };

    const onConversationUpdated = (payload: ChatConversationUpdatedEvent) => {
      queryClient.setQueryData(chatQueryKeys.conversations, (current: { items?: unknown[] } | undefined) => {
        if (!current?.items) return current;
        return {
          ...current,
          items: current.items.map((item) => {
            const typedItem = item as { id: string };
            if (typedItem.id !== payload.conversationId) return item;
            return { ...item, ...payload.patch };
          }),
        };
      });
    };

    const onTyping = (payload: ChatTypingEvent) => {
      if (payload.userId === selfUserId) return;
      const key = `${payload.conversationId}:${payload.userId}`;
      const ttl = (payload.ttlSeconds ?? 4) * 1000;

      setTypingMap((prev) => {
        const currentUsers = new Set(prev[payload.conversationId] ?? []);
        if (payload.isTyping) {
          currentUsers.add(payload.userId);
        } else {
          currentUsers.delete(payload.userId);
        }
        return { ...prev, [payload.conversationId]: Array.from(currentUsers) };
      });

      if (typingTimeoutRef.current[key]) {
        window.clearTimeout(typingTimeoutRef.current[key]);
        delete typingTimeoutRef.current[key];
      }

      if (payload.isTyping) {
        typingTimeoutRef.current[key] = window.setTimeout(() => {
          setTypingMap((prev) => ({
            ...prev,
            [payload.conversationId]: (prev[payload.conversationId] ?? []).filter((id) => id !== payload.userId),
          }));
        }, ttl);
      }
    };

    const onReconnect = () => {
      subscribe();
      if (!activeConversationId) return;

      const lastSeenSeq = getLastSeenSeqFromCache(queryClient, activeConversationId);
      chatApi
        .listMessages(activeConversationId, { afterSeq: lastSeenSeq, limit: 100 })
        .then((response) => {
          response.items.forEach((message) => {
            queryClient.setQueriesData(
              { queryKey: ["chat", "messages", activeConversationId] },
              (current: InfiniteData<ChatListMessagesResponse> | undefined) =>
                appendMessageData(current, message),
            );
          });
          void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
        })
        .catch(() => {
          void queryClient.invalidateQueries({ queryKey: ["chat", "messages", activeConversationId] });
        });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect", onReconnect);
    socket.on("chat:message:new", onMessageNew);
    socket.on("chat:message:updated", onMessageUpdated);
    socket.on("chat:message:deleted", onMessageDeleted);
    socket.on("chat:conversation:updated", onConversationUpdated);
    socket.on("chat:typing", onTyping);

    if (socket.connected) onConnect();
    else socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect", onReconnect);
      socket.off("chat:message:new", onMessageNew);
      socket.off("chat:message:updated", onMessageUpdated);
      socket.off("chat:message:deleted", onMessageDeleted);
      socket.off("chat:conversation:updated", onConversationUpdated);
      socket.off("chat:typing", onTyping);
    };
  }, [activeConversationId, authToken, onActiveConversationRejected, queryClient, selfUserId, subscriptionIds]);

  return {
    isConnected,
    typingByConversation: typingMap,
    rejectedConversationIds,
  };
};
