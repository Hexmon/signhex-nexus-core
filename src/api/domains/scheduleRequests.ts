import { apiClient } from "../apiClient";
import { endpoints } from "../endpoints";
import type { ScheduleRequest, ScheduleRequestPayload } from "../types";

export const scheduleRequestsApi = {
  create: (payload: ScheduleRequestPayload) =>
    apiClient.request<ScheduleRequest>({
      path: endpoints.scheduleRequests.base,
      method: "POST",
      body: payload,
    }),
};
