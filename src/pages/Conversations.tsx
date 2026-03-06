import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { ArrowDown, Plus, ShieldAlert, UserPlus } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { mediaApi } from "@/api/domains/media";
import type { ChatConversationListItem, ChatMessage } from "@/api/types";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { Composer } from "@/components/chat/Composer";
import { ConversationList } from "@/components/chat/ConversationList";
import { ConversationSettingsPanel } from "@/components/chat/ConversationSettingsPanel";
import { CreateConversationModal } from "@/components/chat/CreateConversationModal";
import { InviteMembersModal } from "@/components/chat/InviteMembersModal";
import { MessageList } from "@/components/chat/MessageList";
import { ModerationControls } from "@/components/chat/ModerationControls";
import { ThreadPanel } from "@/components/chat/ThreadPanel";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChatStatusBanner } from "@/components/chat/ChatStatusBanner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useArchiveConversation,
  useChatConversationsList,
  useChatMessages,
  useChatUserDirectory,
  useCreateChatConversation,
  useCreateDm,
  useDeleteChatMessage,
  useDeleteConversation,
  useEditChatMessage,
  useInviteChatMembers,
  useMarkRead,
  useModerateConversation,
  useReactToMessage,
  useSendChatMessage,
  useUnarchiveConversation,
  useUpdateConversationSettings,
} from "@/hooks/chat/useChatQueries";
import { useChatRealtime } from "@/hooks/chat/useChatRealtime";
import { connectChatSocket } from "@/lib/chatSocket";
import { mapChatErrorToUx, type ChatBlockMode } from "@/lib/chatErrors";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useAppSelector } from "@/store/hooks";
import type { ChatPendingUiMessage } from "@/components/chat/types";

const MESSAGES_LIMIT = 50;
const READ_DEBOUNCE_MS = 900;

const getAttachmentId = (attachment: string | { media_id?: string; mediaId?: string }) =>
  typeof attachment === "string" ? attachment : attachment.media_id || attachment.mediaId;

const conversationTitle = (conversation?: ChatConversationListItem) => {
  if (!conversation) return "";
  if (conversation.type === "DM") return conversation.title || "Direct Message";
  return conversation.title || conversation.topic || conversation.purpose || conversation.id;
};

const extractUntil = (details: unknown, keys: string[]) => {
  if (!details || typeof details !== "object") return undefined;
  const typedDetails = details as Record<string, unknown>;
  for (const key of keys) {
    const value = typedDetails[key];
    if (typeof value === "string") return value;
  }
  return undefined;
};

const asBannerMode = (mode: ChatBlockMode) => {
  if (!mode) return undefined;
  return mode;
};

export default function Conversations() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams<{ conversationId?: string; threadRootId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const authToken = useAppSelector((state) => state.auth.token);
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const currentRole = useAppSelector((state) => state.auth.user?.role);
  const { isAdminOrSuperAdmin } = useAuthorization();
  const usersDirectoryQuery = useChatUserDirectory(Boolean(authToken));

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatStatus, setChatStatus] = useState<{
    code?: string;
    message: string;
    mode?: "READ_ONLY" | "MUTED" | "BANNED";
    until?: string;
  } | null>(null);
  const [pendingUiMessages, setPendingUiMessages] = useState<ChatPendingUiMessage[]>([]);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [newMessagesFromSeq, setNewMessagesFromSeq] = useState<number | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const focusMessageId = searchParams.get("focusMessageId");
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const prevLatestSeqRef = useRef(0);

  const conversationsQuery = useChatConversationsList();
  const conversations = useMemo(() => conversationsQuery.data?.items ?? [], [conversationsQuery.data?.items]);
  const selectedConversation = conversations.find((item) => item.id === params.conversationId);
  const afterSeqStart = Math.max((selectedConversation?.last_seq ?? 0) - MESSAGES_LIMIT, 0);
  const messagesQuery = useChatMessages(selectedConversation?.id, {
    afterSeq: afterSeqStart,
    limit: MESSAGES_LIMIT,
  });
  const messages = messagesQuery.items;
  const latestMessageSeq = messagesQuery.latestSeq;

  const sendMessage = useSendChatMessage();
  const editMessage = useEditChatMessage();
  const deleteMessage = useDeleteChatMessage();
  const reactMessage = useReactToMessage();
  const markRead = useMarkRead();
  const createDm = useCreateDm();
  const createConversation = useCreateChatConversation();
  const inviteMembers = useInviteChatMembers();
  const updateSettings = useUpdateConversationSettings();
  const archiveConversation = useArchiveConversation();
  const unarchiveConversation = useUnarchiveConversation();
  const deleteConversation = useDeleteConversation();
  const moderateConversation = useModerateConversation();

  const mentionDisplayById = useMemo(() => {
    const users = usersDirectoryQuery.data?.users ?? [];
    return users.reduce<Record<string, string>>((acc, user) => {
      const displayName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || user.id;
      acc[user.id] = displayName;
      return acc;
    }, {});
  }, [usersDirectoryQuery.data?.users]);

  const handleActiveConversationRejected = useCallback(() => {
    setPendingUiMessages([]);
    setChatStatus({
      code: "FORBIDDEN",
      message: "Access removed / banned / not a member",
      mode: "BANNED",
    });
    setSearchParams({});
    navigate("/chat");
    toast({
      title: "Access removed",
      description: "Access removed / banned / not a member",
      variant: "destructive",
    });
  }, [navigate, setSearchParams, toast]);

  const activeConversationId = selectedConversation?.id;
  const subscriptionIds = useMemo(() => conversations.slice(0, 10).map((item) => item.id), [conversations]);
  const realtime = useChatRealtime({
    activeConversationId,
    subscribedConversationIds: subscriptionIds,
    onActiveConversationRejected: handleActiveConversationRejected,
  });

  const threadRootId = params.threadRootId;
  const threadRootMessage = threadRootId
    ? messages.find((message) => message.id === threadRootId || message.thread_root_id === threadRootId)
    : undefined;

  useEffect(() => {
    if (conversations.length === 0) return;
    if (params.conversationId) return;
    navigate(`/chat/${conversations[0].id}`, { replace: true });
  }, [conversations, navigate, params.conversationId]);

  useEffect(() => {
    if (!messagesQuery.error) return;
    const ux = mapChatErrorToUx(messagesQuery.error);
    const mode = asBannerMode(ux.blockMode);
    if (!mode) return;
    setChatStatus({
      code: ux.code,
      message: ux.message,
      mode,
      until: extractUntil(ux.details, ["muted_until", "banned_until"]),
    });
  }, [messagesQuery.error]);

  useEffect(() => {
    setChatStatus(null);
    setPendingUiMessages([]);
    setShowJumpToLatest(false);
    setNewMessagesFromSeq(null);
    prevLatestSeqRef.current = 0;
  }, [activeConversationId]);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    const onScroll = () => {
      const threshold = 24;
      const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - threshold;
      setIsAtBottom(atBottom);
      if (atBottom) {
        setShowJumpToLatest(false);
        setNewMessagesFromSeq(null);
      }
    };

    viewport.addEventListener("scroll", onScroll);
    onScroll();
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [activeConversationId]);

  useEffect(() => {
    if (!latestMessageSeq) return;
    const previousLatest = prevLatestSeqRef.current;
    if (previousLatest > 0 && latestMessageSeq > previousLatest && !isAtBottom) {
      setShowJumpToLatest(true);
      setNewMessagesFromSeq((current) => current ?? previousLatest + 1);
    }
    prevLatestSeqRef.current = latestMessageSeq;
    if (isAtBottom) {
      setShowJumpToLatest(false);
      setNewMessagesFromSeq(null);
    }
  }, [isAtBottom, latestMessageSeq]);

  const messageMediaIds = useMemo(
    () =>
      Array.from(
        new Set(
          messages.flatMap((message) => {
            const attachments = Array.isArray(message.attachments) ? message.attachments : [];
            return attachments
              .map((attachment) =>
                getAttachmentId(
                  attachment as string | { media_id?: string; mediaId?: string },
                ),
              )
              .filter((id): id is string => Boolean(id));
          }),
        ),
      ),
    [messages],
  );

  const mediaQueries = useQueries({
    queries: messageMediaIds.map((mediaId) => ({
      queryKey: ["media", "chat", mediaId],
      queryFn: () => mediaApi.getById(mediaId),
      enabled: Boolean(activeConversationId),
      staleTime: 60_000,
      retry: 1,
    })),
  });

  const attachmentMediaById = useMemo(() => {
    const map: Record<string, Awaited<ReturnType<typeof mediaApi.getById>>> = {};
    messageMediaIds.forEach((mediaId, index) => {
      if (mediaQueries[index]?.data) {
        map[mediaId] = mediaQueries[index].data;
      }
    });
    return map;
  }, [mediaQueries, messageMediaIds]);

  const archivedStatus =
    selectedConversation?.state === "ARCHIVED"
      ? { code: "CHAT_ARCHIVED", message: "Conversation is archived and read-only.", mode: "READ_ONLY" as const }
      : null;
  const effectiveStatus = chatStatus ?? archivedStatus;

  const canModerate = Boolean(isAdminOrSuperAdmin || currentRole === "ADMIN" || currentRole === "SUPER_ADMIN");
  const canManage =
    canModerate ||
    selectedConversation?.viewer_role === "ADMIN" ||
    selectedConversation?.viewer_role === "OWNER";
  const canInvite =
    selectedConversation?.type === "GROUP_CLOSED" &&
    selectedConversation.invite_policy !== "INVITES_DISABLED" &&
    (selectedConversation.invite_policy === "ANY_MEMBER_CAN_INVITE" ? true : canManage);
  const composerDisabled = Boolean(
    !selectedConversation ||
      effectiveStatus?.mode === "READ_ONLY" ||
      effectiveStatus?.mode === "MUTED" ||
      effectiveStatus?.mode === "BANNED" ||
      selectedConversation.state === "DELETED",
  );

  const emitTyping = (isTyping: boolean) => {
    if (!activeConversationId || !authToken) return;
    const socket = connectChatSocket(authToken);
    socket?.emit("chat:typing", { conversationId: activeConversationId, isTyping });
  };

  const applyChatError = (error: unknown) => {
    const ux = mapChatErrorToUx(error);
    const mode = asBannerMode(ux.blockMode);
    if (mode) {
      setChatStatus({
        code: ux.code,
        message: ux.message,
        mode,
        until: extractUntil(ux.details, ["muted_until", "banned_until"]),
      });
    }

    toast({
      title: ux.toastTitle,
      description: ux.message,
      variant: ux.severity === "error" ? "destructive" : "default",
    });

    return ux;
  };

  const upsertPendingMessage = (message: ChatPendingUiMessage) => {
    setPendingUiMessages((prev) => {
      const exists = prev.some((item) => item.localId === message.localId);
      if (!exists) return [...prev, message];
      return prev.map((item) => (item.localId === message.localId ? message : item));
    });
  };

  const removePendingMessage = (localId: string) => {
    setPendingUiMessages((prev) => prev.filter((item) => item.localId !== localId));
  };

  const sendWithPending = async (
    payload: { text: string; replyTo?: string; attachmentMediaIds: string[] },
    localId?: string,
  ) => {
    if (!activeConversationId) return;
    const id = localId ?? `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextPending: ChatPendingUiMessage = {
      localId: id,
      conversationId: activeConversationId,
      text: payload.text,
      replyTo: payload.replyTo,
      attachmentMediaIds: payload.attachmentMediaIds,
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    upsertPendingMessage(nextPending);

    try {
      await sendMessage.mutateAsync({
        conversationId: activeConversationId,
        text: payload.text,
        replyTo: payload.replyTo,
        attachmentMediaIds: payload.attachmentMediaIds,
      });
      removePendingMessage(id);
      if (chatStatus?.mode !== "READ_ONLY") {
        setChatStatus(null);
      }
    } catch (error) {
      const ux = applyChatError(error);
      upsertPendingMessage({
        ...nextPending,
        status: "failed",
        errorCode: ux.code,
        errorMessage: ux.message,
      });
      throw error;
    }
  };

  const handleSend = async (payload: { text: string; replyTo?: string; attachmentMediaIds: string[] }) => {
    await sendWithPending(payload);
  };

  const readTimerRef = useRef<number | null>(null);
  const lastMarkedRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!activeConversationId || !latestMessageSeq || !isAtBottom || effectiveStatus?.mode === "BANNED") return;
    const previous = lastMarkedRef.current[activeConversationId] ?? 0;
    if (latestMessageSeq <= previous) return;

    if (readTimerRef.current) window.clearTimeout(readTimerRef.current);
    readTimerRef.current = window.setTimeout(() => {
      void markRead.mutateAsync({ conversationId: activeConversationId, lastReadSeq: latestMessageSeq });
      if (authToken) {
        const socket = connectChatSocket(authToken);
        socket?.emit("chat:read", {
          conversationId: activeConversationId,
          lastReadSeq: latestMessageSeq,
        });
      }
      lastMarkedRef.current[activeConversationId] = latestMessageSeq;
    }, READ_DEBOUNCE_MS);

    return () => {
      if (readTimerRef.current) window.clearTimeout(readTimerRef.current);
    };
  }, [activeConversationId, authToken, effectiveStatus?.mode, isAtBottom, latestMessageSeq, markRead]);

  const jumpToLatest = () => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    setShowJumpToLatest(false);
    setNewMessagesFromSeq(null);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button className="flex-1" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New chat
          </Button>
          <Button
            variant="outline"
            onClick={() => setInviteOpen(true)}
            disabled={!selectedConversation || !canInvite}
            aria-label="Invite members"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversation?.id}
          search={search}
          onSearch={setSearch}
          onSelect={(conversationId) => navigate(`/chat/${conversationId}`)}
        />
      </div>

      <div className="relative flex min-h-[calc(100vh-11rem)] flex-col rounded-lg border bg-card">
        <ChatHeader conversation={selectedConversation} onOpenSettings={() => setSettingsOpen(true)} />

        {effectiveStatus?.mode && (
          <ChatStatusBanner
            mode={effectiveStatus.mode}
            message={effectiveStatus.message}
            until={effectiveStatus.until}
          />
        )}

        {!selectedConversation ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a conversation from the left list.
          </div>
        ) : (
          <>
            <div ref={messageViewportRef} className="flex-1 overflow-y-auto">
              <MessageList
                conversationId={selectedConversation.id}
                messages={messages}
                currentUserId={currentUserId}
                canMutate={!composerDisabled}
                mentionDisplayById={mentionDisplayById}
                pendingMessages={pendingUiMessages.filter((item) => item.conversationId === selectedConversation.id)}
                attachmentMediaById={attachmentMediaById}
                isLoading={messagesQuery.isLoading}
                hasNextPage={Boolean(messagesQuery.hasNextPage)}
                focusMessageId={focusMessageId}
                newMessagesFromSeq={newMessagesFromSeq}
                onLoadMore={() => messagesQuery.fetchNextPage()}
                onLoadOlderForFocus={() => messagesQuery.fetchNextPage()}
                onRetryPendingMessage={(localId) => {
                  const pending = pendingUiMessages.find((item) => item.localId === localId);
                  if (!pending) return;
                  void sendWithPending(
                    {
                      text: pending.text,
                      replyTo: pending.replyTo,
                      attachmentMediaIds: pending.attachmentMediaIds,
                    },
                    localId,
                  );
                }}
                onDiscardPendingMessage={removePendingMessage}
                onReply={(messageId) => navigate(`/chat/${selectedConversation.id}/thread/${messageId}`)}
                onReact={async (messageId, emoji, op) => {
                  try {
                    await reactMessage.mutateAsync({ conversationId: selectedConversation.id, messageId, emoji, op });
                  } catch (error) {
                    applyChatError(error);
                  }
                }}
                onEdit={async (messageId, text) => {
                  try {
                    await editMessage.mutateAsync({ conversationId: selectedConversation.id, messageId, text });
                  } catch (error) {
                    applyChatError(error);
                  }
                }}
                onDelete={async (messageId) => {
                  try {
                    await deleteMessage.mutateAsync({ conversationId: selectedConversation.id, messageId });
                  } catch (error) {
                    applyChatError(error);
                  }
                }}
              />
            </div>

            {showJumpToLatest && (
              <Button
                className="absolute bottom-24 right-6 z-10 shadow-md"
                size="sm"
                onClick={jumpToLatest}
                aria-label="Jump to latest message"
              >
                <ArrowDown className="mr-1 h-4 w-4" />
                Jump to latest
              </Button>
            )}

            <TypingIndicator userIds={realtime.typingByConversation[selectedConversation.id] ?? []} />

            <div className="border-t p-3">
              <Composer
                disabled={composerDisabled}
                disabledReason={effectiveStatus?.message}
                isSending={sendMessage.isPending}
                onTyping={emitTyping}
                onSend={handleSend}
              />
            </div>
          </>
        )}
      </div>

      <ThreadPanel
        open={Boolean(selectedConversation && threadRootId)}
        onOpenChange={(open) => {
          if (!selectedConversation) return;
          if (!open) navigate(`/chat/${selectedConversation.id}`);
        }}
        conversationId={selectedConversation?.id}
        threadRootId={threadRootId}
        rootMessage={threadRootMessage}
        currentUserId={currentUserId}
        canMutate={!composerDisabled}
        mentionDisplayById={mentionDisplayById}
        statusBannerMode={effectiveStatus?.mode}
        statusBannerMessage={effectiveStatus?.message}
        statusBannerUntil={effectiveStatus?.until}
        attachmentMediaById={attachmentMediaById}
        onReplySubmit={async ({ text, replyTo, alsoSendToMain }) => {
          await sendWithPending({ text, replyTo, attachmentMediaIds: [] });
          if (alsoSendToMain) {
            await sendWithPending({ text, attachmentMediaIds: [] });
          }
        }}
      />

      <ConversationSettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        conversation={selectedConversation}
        canManage={Boolean(canManage)}
        isSuperAdmin={currentRole === "SUPER_ADMIN"}
        onSave={async (payload) => {
          if (!selectedConversation?.id) return;
          try {
            await updateSettings.mutateAsync({ conversationId: selectedConversation.id, payload });
            toast({ title: "Saved", description: "Conversation settings updated." });
          } catch (error) {
            applyChatError(error);
          }
        }}
        onArchive={async () => {
          if (!selectedConversation?.id) return;
          try {
            await archiveConversation.mutateAsync(selectedConversation.id);
            setChatStatus({ code: "CHAT_ARCHIVED", mode: "READ_ONLY", message: "Conversation is archived and read-only." });
            toast({ title: "Archived", description: "Conversation is now read-only." });
          } catch (error) {
            applyChatError(error);
          }
        }}
        onUnarchive={async () => {
          if (!selectedConversation?.id) return;
          try {
            await unarchiveConversation.mutateAsync(selectedConversation.id);
            setChatStatus(null);
            toast({ title: "Unarchived", description: "Conversation is active again." });
          } catch (error) {
            applyChatError(error);
          }
        }}
        onDelete={async () => {
          if (!selectedConversation?.id) return;
          try {
            await deleteConversation.mutateAsync(selectedConversation.id);
            toast({ title: "Deleted", description: "Conversation removed." });
            navigate("/chat");
          } catch (error) {
            applyChatError(error);
          }
        }}
      />

      <CreateConversationModal
        open={createOpen}
        currentUserId={currentUserId}
        onOpenChange={setCreateOpen}
        onCreateDm={async (otherUserId) => {
          const response = await createDm.mutateAsync(otherUserId);
          const conversationId = response.conversation.id;
          navigate(`/chat/${conversationId}`);
          toast({ title: "DM ready", description: "Direct message opened." });
        }}
        onCreateConversation={async (payload) => {
          const response = await createConversation.mutateAsync(payload);
          navigate(`/chat/${response.conversation.id}`);
          toast({ title: "Conversation created", description: conversationTitle(response.conversation as ChatConversationListItem) });
        }}
      />

      <InviteMembersModal
        open={inviteOpen}
        conversation={selectedConversation}
        currentUserId={currentUserId}
        canInvite={Boolean(canInvite)}
        onOpenChange={setInviteOpen}
        onInvite={async (userIds) => {
          if (!selectedConversation?.id) return;
          await inviteMembers.mutateAsync({ conversationId: selectedConversation.id, userIds });
          toast({ title: "Invites sent", description: `${userIds.length} member(s) invited.` });
        }}
      />

      <div className="fixed bottom-4 right-4 hidden md:block">
        {canModerate && selectedConversation?.type !== "DM" && (
          <div className="w-[330px]">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="h-4 w-4" />
              Moderation tools
            </div>
            <ModerationControls
              conversation={selectedConversation}
              canModerate={canModerate}
              onModerate={async (payload) => {
                if (!selectedConversation?.id) return;
                try {
                  await moderateConversation.mutateAsync({
                    conversationId: selectedConversation.id,
                    payload,
                  });
                  toast({ title: "Moderation updated", description: `${payload.action} applied.` });
                } catch (error) {
                  applyChatError(error);
                }
              }}
            />
          </div>
        )}
      </div>

      <div className="hidden">
        {realtime.isConnected ? "socket-connected" : "socket-disconnected"}
      </div>
    </div>
  );
}
