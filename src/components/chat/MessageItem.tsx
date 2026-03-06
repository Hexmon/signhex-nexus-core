import { useMemo, useState } from "react";
import { CornerDownRight, Pencil, Pin, SmilePlus, Trash2 } from "lucide-react";
import { MediaPreview } from "@/components/common/MediaPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatChatTime } from "@/lib/chatTime";
import type { ChatMessage, MediaAsset } from "@/api/types";

interface MessageItemProps {
  message: ChatMessage;
  currentUserId?: string;
  canMutate?: boolean;
  attachmentMediaById?: Record<string, MediaAsset>;
  mentionDisplayById?: Record<string, string>;
  onReply?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string, op: "add" | "remove") => void;
  onEdit?: (messageId: string, text: string) => void;
  onDelete?: (messageId: string) => void;
}

const mentionPattern = /(@[0-9a-fA-F-]{36})/g;
const mentionTokenPattern = /^@([0-9a-fA-F-]{36})$/;

const renderMessageText = (content: string, mentionDisplayById: Record<string, string>) => {
  const parts = content.split(mentionPattern);
  return parts.map((part, index) => {
    const tokenMatch = part.match(mentionTokenPattern);
    if (!tokenMatch) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    const userId = tokenMatch[1];
    const label = mentionDisplayById[userId] ? `@${mentionDisplayById[userId]}` : part;
    return (
      <span key={`${part}-${index}`} className="font-medium text-primary">
        {label}
      </span>
    );
  });
};

const getAttachmentId = (attachment: string | ChatMessage["attachments"][number]) => {
  if (typeof attachment === "string") return attachment;
  return attachment?.media_id || attachment?.mediaId;
};

export function MessageItem({
  message,
  currentUserId,
  canMutate = true,
  attachmentMediaById = {},
  mentionDisplayById = {},
  onReply,
  onReact,
  onEdit,
  onDelete,
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.body_text || "");
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  const isDeleted = Boolean(message.deleted_at);
  const isMine = currentUserId ? currentUserId === message.sender_id : false;

  const reactionsByEmoji = useMemo(() => {
    const map = new Map<string, Set<string>>();
    (message.reactions ?? []).forEach((reaction) => {
      if (!map.has(reaction.emoji)) map.set(reaction.emoji, new Set());
      map.get(reaction.emoji)?.add(reaction.user_id);
    });
    return map;
  }, [message.reactions]);

  return (
    <div className="space-y-2 rounded-md border bg-background p-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{message.sender_id}</span>
          <span>#{message.seq}</span>
          {message.edited_at && !isDeleted && (
            <Badge variant="outline" aria-label="Message edited">
              edited {formatChatTime(message.edited_at, { includeDate: false })}
            </Badge>
          )}
          {message.thread_reply_count ? <Badge variant="secondary">{message.thread_reply_count} replies</Badge> : null}
        </div>
        <span>{formatChatTime(message.created_at)}</span>
      </div>

      {isDeleted ? (
        <div className="rounded-md bg-muted/70 p-2 text-sm italic text-muted-foreground">
          This message was deleted.
        </div>
      ) : isEditing ? (
        <div className="flex items-center gap-2">
          <Input value={draft} onChange={(event) => setDraft(event.target.value)} />
          <Button
            size="sm"
            onClick={() => {
              onEdit?.(message.id, draft.trim());
              setIsEditing(false);
            }}
            disabled={!draft.trim()}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          {renderMessageText(message.body_text || "", mentionDisplayById)}
        </div>
      )}

      {!isDeleted && attachments.length > 0 && (
        <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
          {attachments.map((attachment, index) => {
            const attachmentId = getAttachmentId(attachment);
            const media = attachmentId ? attachmentMediaById[attachmentId] : undefined;
            const trustedUrl =
              media?.media_url ||
              (typeof attachment === "object" ? attachment.media_url || undefined : undefined);

            return (
              <div
                key={attachmentId || `${message.id}-attachment-${index}`}
                className="space-y-2 rounded-md border p-2"
              >
                <MediaPreview
                  media={media}
                  url={trustedUrl}
                  type={media?.content_type || (typeof attachment === "object" ? attachment.content_type : undefined)}
                  alt={media?.filename || (typeof attachment === "object" ? attachment.filename : "Attachment")}
                  className="h-36 w-full"
                />
                <div className="truncate text-xs text-muted-foreground">
                  {media?.filename || (typeof attachment === "object" ? attachment.filename : attachmentId)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isDeleted && (
        <div className="flex flex-wrap items-center gap-2">
          {Array.from(reactionsByEmoji.entries()).map(([emoji, users]) => {
            const reactedByMe = currentUserId ? users.has(currentUserId) : false;
            return (
              <button
                key={`${message.id}-${emoji}`}
                type="button"
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  reactedByMe ? "border-primary bg-primary/10 text-primary" : "border-border"
                }`}
                onClick={() => onReact?.(message.id, emoji, reactedByMe ? "remove" : "add")}
                disabled={!canMutate}
                aria-label={`React with ${emoji}`}
              >
                {emoji} {users.size}
              </button>
            );
          })}

          <Button size="sm" variant="ghost" onClick={() => onReply?.(message.id)} aria-label="Reply in thread">
            <CornerDownRight className="mr-1 h-3.5 w-3.5" />
            Reply
          </Button>

          <Button size="sm" variant="ghost" onClick={() => onReact?.(message.id, ":thumbsup:", "add")} disabled={!canMutate} aria-label="Add reaction">
            <SmilePlus className="mr-1 h-3.5 w-3.5" />
            React
          </Button>

          {isMine && (
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} disabled={!canMutate} aria-label="Edit message">
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Edit
            </Button>
          )}

          {isMine && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete?.(message.id)}
              disabled={!canMutate}
              className="text-destructive"
              aria-label="Delete message"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          )}

          <Button size="sm" variant="ghost" disabled>
            <Pin className="mr-1 h-3.5 w-3.5" />
            Pin (soon)
          </Button>
        </div>
      )}
    </div>
  );
}
