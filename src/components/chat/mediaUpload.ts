import { ApiError } from "@/api/apiClient";
import { mediaApi } from "@/api/domains/media";
import type { MediaAsset } from "@/api/types";

export const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".mp4",
  ".mov",
  ".pdf",
  ".ppt",
  ".pptx",
  ".csv",
  ".doc",
  ".docx",
]);

class UploadHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "UploadHttpError";
    this.status = status;
  }
}

const isImageOrVideo = (contentType: string) =>
  contentType.startsWith("image/") || contentType.startsWith("video/");

const extFromName = (name: string) =>
  name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase() : "";

export const validateUploadFile = (file: File): string | null => {
  const ext = extFromName(file.name);
  const allowed = allowedMimeTypes.has(file.type) || (ext && allowedExtensions.has(ext));
  if (!allowed) {
    return "Unsupported file type. Allowed: JPEG, PNG, WEBP, MP4, MOV, PDF, PPT/PPTX, CSV, DOC/DOCX.";
  }
  return null;
};

export const readMediaMetadata = (
  file: File,
): Promise<Partial<{ width: number; height: number; duration_seconds: number }>> =>
  new Promise((resolve) => {
    if (typeof window === "undefined") return resolve({});

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve({});
        URL.revokeObjectURL(url);
      };
      img.src = url;
      return;
    }

    if (file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth || undefined,
          height: video.videoHeight || undefined,
          duration_seconds: Number.isNaN(video.duration) ? undefined : Math.round(video.duration),
        });
        URL.revokeObjectURL(url);
      };
      video.onerror = () => {
        resolve({});
        URL.revokeObjectURL(url);
      };
      video.src = url;
      return;
    }

    resolve({});
  });

const uploadViaXhr = (
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void,
) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      const progress = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onProgress(progress);
    };

    xhr.onerror = () => {
      reject(new UploadHttpError(0, "Upload failed due to a network error."));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      const message = xhr.responseText || "Upload failed.";
      reject(new UploadHttpError(xhr.status, message));
    };

    xhr.send(file);
  });

export const uploadFileToMedia = async (
  file: File,
  onProgress?: (percent: number) => void,
): Promise<MediaAsset> => {
  const contentType = file.type || "application/octet-stream";
  const presign = await mediaApi.presignUpload({
    filename: file.name,
    content_type: contentType,
    size: file.size,
  });

  await uploadViaXhr(presign.upload_url, file, contentType, onProgress);

  const metadata = await readMediaMetadata(file);
  return mediaApi.complete(presign.media_id, {
    status: "READY",
    content_type: contentType,
    size: file.size,
    ...metadata,
  });
};

export const getFriendlyUploadError = (error: unknown): string => {
  const status =
    error instanceof ApiError
      ? error.status
      : error instanceof UploadHttpError
      ? error.status
      : undefined;

  if (status === 413) return "Upload failed: file is too large.";
  if (status === 415) return "Upload failed: unsupported file type.";
  if (status === 403) return "Upload failed: you do not have permission to upload this file.";

  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Upload failed. Please try again.";
};

export const createLocalPreviewUrl = (file: File) => {
  const contentType = file.type || "";
  if (!isImageOrVideo(contentType)) return undefined;
  return URL.createObjectURL(file);
};
