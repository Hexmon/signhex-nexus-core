import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/api/types";

type MediaPreviewProps = {
  media?: MediaAsset;
  url?: string;
  type?: string;
  alt?: string;
  className?: string;
};

export function MediaPreview({ media, url, type, alt, className }: MediaPreviewProps) {
  const sourceUrl = url ?? media?.media_url ?? media?.thumbnail_object_id;
  const resolvedType = (type ?? media?.type ?? "").toUpperCase();
  const contentType =
    media?.content_type || media?.source_content_type || "";
  const showVideo =
    Boolean(sourceUrl) &&
    (resolvedType === "VIDEO" || contentType.startsWith("video/"));
  const showImage =
    Boolean(sourceUrl) &&
    (resolvedType === "IMAGE" ||
      contentType.startsWith("image/") ||
      (!showVideo && Boolean(sourceUrl)));

  if (showVideo) {
    return (
      <video
        src={sourceUrl}
        className={cn("rounded-md bg-muted object-cover", className)}
        controls
        preload="metadata"
        muted
      />
    );
  }

  if (showImage) {
    return (
      <img
        src={sourceUrl}
        alt={alt ?? media?.name ?? media?.filename ?? "Media preview"}
        className={cn("rounded-md object-cover bg-muted", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs text-center px-2 py-3",
        className,
      )}
    >
      No preview available
    </div>
  );
}
