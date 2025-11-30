import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingIndicator({ label = "Loading...", fullScreen = false, className }: LoadingIndicatorProps) {
  const content = (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  if (!fullScreen) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="rounded-md border bg-card px-4 py-3 shadow-sm">{content}</div>
    </div>
  );
}
