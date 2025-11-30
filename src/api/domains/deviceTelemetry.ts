import { apiClient } from "../apiClient";
import type { DeviceCommand } from "../types";

export const deviceTelemetryApi = {
  heartbeat: (payload: Record<string, unknown>) =>
    apiClient.request<void>({
      path: "/v1/device/heartbeat",
      method: "POST",
      body: payload,
    }),

  proofOfPlay: (payload: Record<string, unknown>) =>
    apiClient.request<void>({
      path: "/v1/device/proof-of-play",
      method: "POST",
      body: payload,
    }),

  screenshot: (payload: { device_id: string; image: string }) =>
    apiClient.request<void>({
      path: "/v1/device/screenshot",
      method: "POST",
      body: payload,
    }),

  listCommands: (deviceId: string) =>
    apiClient.request<DeviceCommand[]>({
      path: `/v1/device/${deviceId}/commands`,
      method: "GET",
    }),

  ackCommand: (deviceId: string, commandId: string) =>
    apiClient.request<void>({
      path: `/v1/device/${deviceId}/commands/${commandId}/ack`,
      method: "POST",
    }),
};
