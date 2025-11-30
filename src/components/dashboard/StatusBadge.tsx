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
  | "offline"
  | "maintenance";

interface StatusBadgeProps {
  status?: Status | string;
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
  maintenance: { label: "Maintenance", variant: "outline", className: "border-warning text-warning" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = (status || "offline").toLowerCase().replace(/\s+/g, "_") as Status;
  const config =
    statusConfig[normalized] ?? { label: status ?? "Unknown", variant: "secondary" as const };
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
