export const queryKeys = {
  departments: ["departments"] as const,
  screens: ["screens"] as const,
  screenGroups: ["screen-groups"] as const,
  media: ["media"] as const,
  presentations: ["presentations"] as const,
  users: ["users"] as const,
  auditLogs: (resource?: string, action?: string) => ["audit-logs", resource, action] as const,
  notifications: ["notifications"] as const,
  emergencyStatus: ["emergency-status"] as const,
};
