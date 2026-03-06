interface TypingIndicatorProps {
  userIds?: string[];
}

export function TypingIndicator({ userIds = [] }: TypingIndicatorProps) {
  if (userIds.length === 0) return null;

  return (
    <div className="px-4 py-1 text-xs text-muted-foreground">
      {userIds.length === 1
        ? `${userIds[0]} is typing...`
        : `${userIds.slice(0, 2).join(", ")} ${userIds.length > 2 ? `+${userIds.length - 2} others ` : ""}are typing...`}
    </div>
  );
}
