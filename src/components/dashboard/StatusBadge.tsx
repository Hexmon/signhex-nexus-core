import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Status = 
  | "pending" 
  | "in_review" 
  | "changes_requested" 
  | "approved" 
  | "scheduled" 
  | "published"
  | "live" 
  | "expired" 
  | "failed"
  | "online"
  | "offline";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  pending: { label: "Pending", variant: "outline", className: "border-warning text-warning" },
  in_review: { label: "In Review", variant: "outline", className: "border-info text-info" },
  changes_requested: { label: "Changes Requested", variant: "outline", className: "border-warning text-warning" },
  approved: { label: "Approved", variant: "outline", className: "border-success text-success" },
  scheduled: { label: "Scheduled", variant: "outline", className: "border-info text-info" },
  published: { label: "Published", variant: "default", className: "bg-primary text-primary-foreground" },
  live: { label: "Live", variant: "default", className: "bg-success text-success-foreground" },
  expired: { label: "Expired", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  online: { label: "Online", variant: "default", className: "bg-success text-success-foreground" },
  offline: { label: "Offline", variant: "secondary" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
