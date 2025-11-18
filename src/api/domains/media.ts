import { apiClient } from "../apiClient";
import type { MediaAsset, PaginatedResponse, PaginationParams } from "../types";

export interface PresignPayload {
  filename: string;
  content_type: string;
  size: number;
}

export interface MediaCompletionPayload {
  status?: string;
  content_type?: string;
  size?: number;
  width?: number;
  height?: number;
  duration_seconds?: number;
}

export const mediaApi = {
  presignUpload: (payload: PresignPayload) =>
    apiClient.request<{
      upload_url: string;
      media_id: string;
      bucket: string;
      object_key: string;
      expires_in: number;
    }>({
      path: "/v1/media/presign-upload",
      method: "POST",
      body: payload,
    }),

  complete: (mediaId: string, payload: MediaCompletionPayload) =>
    apiClient.request<MediaAsset>({
      path: `/v1/media/${mediaId}/complete`,
      method: "POST",
      body: payload,
    }),

  list: (params?: PaginationParams & { type?: string; status?: string }) =>
    apiClient.request<PaginatedResponse<MediaAsset>>({
      path: "/v1/media",
      method: "GET",
      query: params,
    }),

  getById: (mediaId: string) =>
    apiClient.request<MediaAsset>({
      path: `/v1/media/${mediaId}`,
      method: "GET",
    }),
};
