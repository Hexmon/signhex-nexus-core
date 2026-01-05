import { apiClient } from "../apiClient";
import { endpoints } from "../endpoints";
import type { MediaAsset, MediaListParams, MediaType, PaginatedResponse } from "../types";

export interface PresignPayload {
  filename: string;
  content_type: string;
  size: number;
}

export interface PresignResponse {
  upload_url: string;
  media_id: string;
  bucket: string;
  object_key: string;
  expires_in: number;
}

export interface MediaCompletionPayload {
  status?: string;
  content_type?: string;
  size?: number;
  width?: number;
  height?: number;
  duration_seconds?: number;
}

export interface MediaMetadataPayload {
  name: string;
  type: MediaType;
}

export const mediaApi = {
  // Create a metadata-only media entry (no upload).
  createMetadata: (payload: MediaMetadataPayload) =>
    apiClient.request<MediaAsset>({
      path: endpoints.media.base,
      method: "POST",
      body: payload,
    }),

  presignUpload: (payload: PresignPayload) =>
    apiClient.request<PresignResponse>({
      path: endpoints.media.presignUpload,
      method: "POST",
      body: payload,
    }),

  complete: (mediaId: string, payload: MediaCompletionPayload) =>
    apiClient.request<MediaAsset>({
      path: endpoints.media.complete(mediaId),
      method: "POST",
      body: payload,
    }),

  list: (params?: MediaListParams) =>
    apiClient.request<PaginatedResponse<MediaAsset>>({
      path: endpoints.media.base,
      method: "GET",
      query: params,
    }),

  getById: (mediaId: string) =>
    apiClient.request<MediaAsset>({
      path: endpoints.media.byId(mediaId),
      method: "GET",
    }),

  remove: (mediaId: string, options?: { hard?: boolean }) =>
    apiClient.request<{ message?: string } | void>({
      path: endpoints.media.byId(mediaId),
      method: "DELETE",
      query: options?.hard ? { hard: true } : undefined,
    }),
};
