import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ChatConversationListItem, ChatInvitePolicy } from "@/api/types";

interface ConversationSettingsPanelProps {
  conversation?: ChatConversationListItem;
  open: boolean;
  canManage: boolean;
  isSuperAdmin?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: {
    title?: string | null;
    topic?: string | null;
    purpose?: string | null;
    invite_policy?: ChatInvitePolicy;
  }) => Promise<void> | void;
  onArchive: () => Promise<void> | void;
  onUnarchive: () => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}

export function ConversationSettingsPanel({
  conversation,
  open,
  canManage,
  isSuperAdmin = false,
  onOpenChange,
  onSave,
  onArchive,
  onUnarchive,
  onDelete,
}: ConversationSettingsPanelProps) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [purpose, setPurpose] = useState("");
  const [invitePolicy, setInvitePolicy] = useState<ChatInvitePolicy>("ANY_MEMBER_CAN_INVITE");

  useEffect(() => {
    if (!conversation) return;
    setTitle(conversation.title || "");
    setTopic(conversation.topic || "");
    setPurpose(conversation.purpose || "");
    setInvitePolicy(conversation.invite_policy || "ANY_MEMBER_CAN_INVITE");
  }, [conversation]);

  const isArchived = conversation?.state === "ARCHIVED";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-[420px]">
        <SheetHeader>
          <SheetTitle>Conversation Settings</SheetTitle>
          <SheetDescription>Update metadata and lifecycle controls.</SheetDescription>
        </SheetHeader>

        {!conversation ? (
          <p className="mt-4 text-sm text-muted-foreground">No conversation selected.</p>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="chat-title">Title</Label>
              <Input
                id="chat-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={!canManage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chat-topic">Topic</Label>
              <Input
                id="chat-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                disabled={!canManage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chat-purpose">Purpose</Label>
              <Input
                id="chat-purpose"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                disabled={!canManage}
              />
            </div>

            {conversation.type !== "DM" && (
              <div className="space-y-2">
                <Label>Invite Policy</Label>
                <Select
                  value={invitePolicy}
                  onValueChange={(value) => setInvitePolicy(value as ChatInvitePolicy)}
                  disabled={!canManage}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANY_MEMBER_CAN_INVITE">Any member can invite</SelectItem>
                    <SelectItem value="ADMINS_ONLY_CAN_INVITE">Admins only can invite</SelectItem>
                    <SelectItem value="INVITES_DISABLED">Invites disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() =>
                onSave({
                  title: title || null,
                  topic: topic || null,
                  purpose: purpose || null,
                  invite_policy: invitePolicy,
                })
              }
              disabled={!canManage}
            >
              Save settings
            </Button>

            <div className="space-y-2 rounded-md border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Lifecycle</p>
              {isArchived ? (
                <Button className="w-full" variant="outline" onClick={() => onUnarchive()} disabled={!canManage}>
                  Unarchive conversation
                </Button>
              ) : (
                <Button className="w-full" variant="outline" onClick={() => onArchive()} disabled={!canManage}>
                  Archive conversation
                </Button>
              )}
            </div>

            {isSuperAdmin && (
              <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Danger Zone
                </p>
                <p className="text-xs text-muted-foreground">
                  Hard delete purges message history and removes conversation from all users.
                </p>
                <Button className="w-full" variant="destructive" onClick={() => onDelete()}>
                  Delete conversation permanently
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
