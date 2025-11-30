import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionIcon?: React.ReactNode;
  trailingContent?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
  actionIcon,
  trailingContent,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {trailingContent}
        {actionLabel && onAction && (
          <Button onClick={onAction} disabled={actionDisabled} className="gap-2">
            {actionIcon}
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
