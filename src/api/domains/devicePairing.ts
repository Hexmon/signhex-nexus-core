import { apiClient } from "../apiClient";
import type { DevicePairing, PaginatedResponse, PaginationParams } from "../types";

export const devicePairingApi = {
  generate: (payload: { device_id?: string }) =>
    apiClient.request<DevicePairing>({
      path: "/v1/device-pairing/generate",
      method: "POST",
      body: payload,
    }),

  complete: (payload: { pairing_code: string }) =>
    apiClient.request<DevicePairing>({
      path: "/v1/device-pairing/complete",
      method: "POST",
      body: payload,
    }),

  list: (params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<DevicePairing>>({
      path: "/v1/device-pairing",
      method: "GET",
      query: params,
    }),
};
