import { ApiError } from "../apiClient";
import type { DeviceScheduleSnapshot } from "../types";

const DEVICE_API_BASE_URL =
  import.meta.env.VITE_DEVICE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

const buildUrl = (deviceId: string) => {
  const base = DEVICE_API_BASE_URL.replace(/\/$/, "");
  return `${base}/v1/device/${encodeURIComponent(deviceId)}/schedule`;
};

export const deviceScheduleApi = {
  getSchedule: async (deviceId: string) => {
    const response = await fetch(buildUrl(deviceId), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    if (!response.ok) {
      throw new ApiError({
        status: response.status,
        message:
          typeof payload === "object" && payload && "message" in payload
            ? (payload as Record<string, unknown>)["message"]?.toString() ?? "Unable to fetch schedule"
            : "Unable to fetch schedule",
      });
    }

    return payload as DeviceScheduleSnapshot;
  },
};
