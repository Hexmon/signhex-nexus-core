import { apiClient } from "../apiClient";
import { endpoints } from "../endpoints";
import type { DevicePairing, DevicePairingRequest, PaginatedResponse, PaginationParams } from "../types";

export const devicePairingApi = {
  // Generate pairing code (for device setup)
  generate: (payload: { device_id?: string; expires_in?: number }) =>
    apiClient.request<DevicePairing>({
      path: endpoints.devicePairing.generate,
      method: "POST",
      body: payload,
    }),

  // Complete pairing (from device side with CSR)
  complete: (payload: { pairing_code: string; csr?: string }) =>
    apiClient.request<DevicePairing>({
      path: endpoints.devicePairing.complete,
      method: "POST",
      body: payload,
    }),

  // List all pairing records (for reviewing pending/used/expired codes)
  list: (params?: PaginationParams) =>
    apiClient.request<PaginatedResponse<DevicePairing>>({
      path: endpoints.devicePairing.base,
      method: "GET",
      query: params,
    }),

  // Device pairing request (from screen device)
  request: (payload: DevicePairingRequest) =>
    apiClient.request<DevicePairing>({
      path: "/device-pairing/request",
      method: "POST",
      body: payload,
    }),

  // Confirm pairing and create screen (from CMS)
  confirm: (payload: { pairing_code: string; name: string; location?: string }) =>
    apiClient.request<{ screen: { id: string; name: string }; pairing: DevicePairing }>({
      path: "/device-pairing/confirm",
      method: "POST",
      body: payload,
    }),
};