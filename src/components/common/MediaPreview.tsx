import { useEffect, useState } from "react";
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
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const normalizedType = (
    type ??
    media?.content_type ??
    media?.source_content_type ??
    media?.type ??
    ""
  ).toLowerCase();
  const mediaType = (media?.type ?? "").toLowerCase();
  const extension = sourceUrl
    ? sourceUrl.split("?")[0].split(".").pop()?.toLowerCase() ?? ""
    : "";

  const showVideo =
    Boolean(sourceUrl) &&
    (normalizedType.startsWith("video/") ||
      normalizedType === "video" ||
      mediaType === "video" ||
      ["mp4", "mov", "webm", "m4v", "ogg"].includes(extension));

  const showPdf =
    Boolean(sourceUrl) &&
    (normalizedType.includes("pdf") || extension === "pdf");

  const showImage =
    Boolean(sourceUrl) &&
    (normalizedType.startsWith("image/") ||
      normalizedType === "image" ||
      mediaType === "image" ||
      ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif"].includes(extension));

  useEffect(() => {
    setPdfLoaded(false);
  }, [showPdf, sourceUrl]);

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

  if (showPdf) {
    return (
      <div className={cn("relative overflow-hidden rounded-md bg-muted", className)}>
        {!pdfLoaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
        <iframe
          src={sourceUrl}
          title={alt ?? media?.name ?? media?.filename ?? "PDF preview"}
          onLoad={() => setPdfLoaded(true)}
          className={cn("h-full w-full border-0 transition-opacity", pdfLoaded ? "opacity-100" : "opacity-0")}
        />
      </div>
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
