import { apiClient } from "../apiClient";
import type { OrgSetting } from "../types";

export const settingsApi = {
  list: () =>
    apiClient.request<OrgSetting[]>({
      path: "/v1/settings",
      method: "GET",
    }),

  upsert: (payload: OrgSetting) =>
    apiClient.request<OrgSetting>({
      path: "/v1/settings",
      method: "POST",
      body: payload,
    }),
};
