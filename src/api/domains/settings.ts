import { apiClient } from "../apiClient";
import { endpoints } from "../endpoints";
import type { DefaultMediaSetting, OrgSetting } from "../types";

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

  getDefaultMedia: () =>
    apiClient.request<DefaultMediaSetting>({
      path: endpoints.settings.defaultMedia,
      method: "GET",
    }),

  updateDefaultMedia: (mediaId: string | null) =>
    apiClient.request<DefaultMediaSetting>({
      path: endpoints.settings.defaultMedia,
      method: "PUT",
      body: { media_id: mediaId },
    }),
};
