import { apiClient } from "../apiClient";
import { endpoints } from "../endpoints";
import type { DevicePairing, PaginatedResponse, PaginationParams } from "../types";

export const devicePairingApi = {
  generate: (payload: { device_id?: string }) =>
    apiClient.request<DevicePairing>({
      path: endpoints.devicePairing.generate,
      method: "POST",
      body: payload,
    }),

  complete: (payload: { pairing_code: string }) =>
    apiClient.request<DevicePairing>({
      path: endpoints.devicePairing.complete,
      method: "POST",
      body: payload,
    }),

  list: (params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<DevicePairing>>({
      path: endpoints.devicePairing.base,
      method: "GET",
      query: params,
    }),
};
