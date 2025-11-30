import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { conversationsApi } from "@/api/domains/conversations";
import type { Conversation, ConversationMessage } from "@/api/types";
import { ApiError } from "@/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Conversations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: conversationsApi.list,
  });

  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", selectedConversation?.id],
    queryFn: () =>
      selectedConversation
        ? conversationsApi.listMessages(selectedConversation.id, { page: 1, limit: 50 })
        : Promise.resolve({ items: [], page: 1, limit: 50, total: 0 }),
    enabled: Boolean(selectedConversation),
  });

  const sendMessage = useMutation({
    mutationFn: (payload: { conversationId: string; content: string }) =>
      conversationsApi.sendMessage(payload.conversationId, { content: payload.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-messages", selectedConversation?.id] });
      setMessage("");
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Unable to send message.";
      toast({ title: "Send failed", description: msg, variant: "destructive" });
    },
  });

  const filteredConversations = useMemo(() => {
    const list = conversationsQuery.data?.items ?? conversationsQuery.data ?? [];
    const q = search.toLowerCase();
    return list.filter((conv: Conversation) => conv.id.toLowerCase().includes(q));
  }, [conversationsQuery.data, search]);

  const messages = useMemo(
    () => messagesQuery.data?.items ?? messagesQuery.data ?? [],
    [messagesQuery.data]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder="Search by ID..."
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {conversationsQuery.isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => <Skeleton key={idx} className="h-12" />)
          ) : filteredConversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            filteredConversations.map((conv: Conversation) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full text-left p-3 rounded-md border transition-colors ${
                  selectedConversation?.id === conv.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="text-sm font-semibold text-foreground">Conversation #{conv.id}</div>
                <div className="text-xs text-muted-foreground">Participant: {conv.participant_id}</div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>{selectedConversation ? `Conversation ${selectedConversation.id}` : "Select a conversation"}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <div className="flex-1 rounded-md border p-3 space-y-3 overflow-y-auto">
            {messagesQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => <Skeleton key={idx} className="h-10" />)
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              messages.map((msg: ConversationMessage) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{msg.author_id}</span>
                    <span>{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm leading-snug bg-accent text-accent-foreground rounded-md p-2">
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!selectedConversation}
            />
            <div className="flex justify-end">
              <Button
                onClick={() =>
                  selectedConversation &&
                  sendMessage.mutate({ conversationId: selectedConversation.id, content: message.trim() })
                }
                disabled={!selectedConversation || !message.trim() || sendMessage.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {sendMessage.isPending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
