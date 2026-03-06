import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "@/api/domains/notifications";
import type { ChatNotificationData, Notification } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatChatTime } from "@/lib/chatTime";

type ReadFilter = "all" | "unread" | "read";

const toChatData = (notification: Notification): ChatNotificationData | null => {
  const data = notification.data;
  if (!data || typeof data !== "object") return null;
  const typed = data as Record<string, unknown>;
  if (!typed.conversationId || typeof typed.conversationId !== "string") return null;
  return {
    conversationId: typed.conversationId as string,
    messageId: typeof typed.messageId === "string" ? typed.messageId : undefined,
    notificationType:
      typed.notificationType === "DM" || typed.notificationType === "MENTION" || typed.notificationType === "THREAD_REPLY"
        ? (typed.notificationType as "DM" | "MENTION" | "THREAD_REPLY")
        : "DM",
    snippet: typeof typed.snippet === "string" ? typed.snippet : undefined,
  };
};

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const notificationsQuery = useQuery({
    queryKey: ["notifications", readFilter],
    queryFn: () =>
      notificationsApi.list({
        page: 1,
        limit: 50,
        read: readFilter === "all" ? undefined : readFilter === "read",
      }),
  });

  const notifications = useMemo(() => notificationsQuery.data?.items ?? [], [notificationsQuery.data?.items]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read && !notification.read_at).length,
    [notifications],
  );

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const openNotification = async (notification: Notification) => {
    const data = toChatData(notification);
    if (!data) return;

    if (!notification.read) {
      await markReadMutation.mutateAsync(notification.id);
    }

    const target = data.messageId
      ? `/chat/${data.conversationId}?focusMessageId=${encodeURIComponent(data.messageId)}`
      : `/chat/${data.conversationId}`;
    navigate(target);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Notifications
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <Tabs value={readFilter} onValueChange={(value) => setReadFilter(value as ReadFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>

          {notificationsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications found.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const chatData = toChatData(notification);
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void openNotification(notification)}
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      notification.read || notification.read_at
                        ? "border-border bg-background"
                        : "border-primary/50 bg-primary/5"
                    }`}
                    disabled={!chatData}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{notification.title || chatData?.notificationType || "Notification"}</p>
                        <p className="text-xs text-muted-foreground">
                          {chatData?.snippet || notification.body || "Open chat conversation"}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatChatTime(notification.created_at)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Supports DM, mention, and thread-reply notifications with chat deep links.
      </p>
    </div>
  );
}
