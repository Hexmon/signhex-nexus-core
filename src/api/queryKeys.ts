export const queryKeys = {
  departments: ["departments"] as const,
  screens: ["screens"] as const,
  screenGroups: ["screen-groups"] as const,
  screenSnapshot: (screenId?: string) => ["screens", "snapshot", screenId] as const,
  screenGroupSnapshot: (groupId?: string) => ["screen-groups", "snapshot", groupId] as const,
  media: ["media"] as const,
  mediaById: (mediaId?: string) => ["media", "by-id", mediaId] as const,
  presentations: ["presentations"] as const,
  users: ["users"] as const,
  settings: ["settings"] as const,
  defaultMedia: ["settings", "default-media"] as const,
  roles: (filters?: { page?: number; limit?: number; search?: string }) =>
    ["roles", filters?.page, filters?.limit, filters?.search] as const,
  role: (roleId?: string) => ["role", roleId] as const,
  permissionsMetadata: ["permissions-metadata"] as const,
  auditLogs: (resource?: string, action?: string) => ["audit-logs", resource, action] as const,
  notifications: ["notifications"] as const,
  scheduleRequests: (filters?: {
    page?: number;
    limit?: number;
    status?: string;
    include?: string;
  }) =>
    ["schedule-requests", filters?.status, filters?.page, filters?.limit, filters?.include] as const,
  scheduleRequestSummary: ["schedule-requests", "status-summary"] as const,
  emergencyStatus: ["emergency-status"] as const,
  layouts: (filters?: {
    page?: number;
    limit?: number;
    search?: string;
    aspect_ratio?: string;
  }) =>
    [
      "layouts",
      filters?.page,
      filters?.limit,
      filters?.search,
      filters?.aspect_ratio,
    ] as const,
};
