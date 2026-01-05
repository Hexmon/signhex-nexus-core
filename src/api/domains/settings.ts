import { apiClient } from "../apiClient";
import { endpoints } from "../endpoints";
import type { OrgSetting } from "../types";

export const settingsApi = {
  list: () =>
    apiClient.request<OrgSetting[]>({
      path: endpoints.settings.base,
      method: "GET",
    }),

  upsert: (payload: OrgSetting) =>
    apiClient.request<OrgSetting>({
      path: endpoints.settings.base,
      method: "POST",
      body: payload,
    }),
};
