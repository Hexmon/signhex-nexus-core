export const API_BASE_PATH = "/api/v1";

export const endpoints = {
  apiKeys: {
    base: "/api-keys",
    rotate: (apiKeyId: string) => `/api-keys/${apiKeyId}/rotate`,
    revoke: (apiKeyId: string) => `/api-keys/${apiKeyId}/revoke`,
  },
  auditLogs: {
    base: "/audit-logs",
    byId: (auditLogId: string) => `/audit-logs/${auditLogId}`,
  },
  auth: {
    login: "/auth/login",
    me: "/auth/me",
    logout: "/auth/logout",
  },
  conversations: {
    base: "/conversations",
    messages: (conversationId: string) => `/conversations/${conversationId}/messages`,
    markRead: (conversationId: string) => `/conversations/${conversationId}/read`,
  },
  departments: {
    base: "/departments",
    byId: (departmentId: string) => `/departments/${departmentId}`,
  },
  devicePairing: {
    base: "/device-pairing",
    generate: "/device-pairing/generate",
    complete: "/device-pairing/complete",
  },
  deviceTelemetry: {
    heartbeat: "/device/heartbeat",
    proofOfPlay: "/device/proof-of-play",
    screenshot: "/device/screenshot",
    commands: (deviceId: string) => `/device/${deviceId}/commands`,
    ackCommand: (deviceId: string, commandId: string) =>
      `/device/${deviceId}/commands/${commandId}/ack`,
  },
  emergency: {
    trigger: "/emergency/trigger",
    status: "/emergency/status",
    clear: (emergencyId: string) => `/emergency/${emergencyId}/clear`,
    history: "/emergency/history",
  },
  health: {
    base: "/health",
  },
  media: {
    base: "/media",
    presignUpload: "/media/presign-upload",
    complete: (mediaId: string) => `/media/${mediaId}/complete`,
    byId: (mediaId: string) => `/media/${mediaId}`,
  },
  metrics: {
    overview: "/metrics/overview",
  },
  notifications: {
    base: "/notifications",
    byId: (notificationId: string) => `/notifications/${notificationId}`,
    markRead: (notificationId: string) => `/notifications/${notificationId}/read`,
    markAllRead: "/notifications/read-all",
  },
  layouts: {
    base: "/layouts",
    byId: (layoutId: string) => `/layouts/${layoutId}`,
  },
  presentations: {
    base: "/presentations",
    byId: (presentationId: string) => `/presentations/${presentationId}`,
    slots: (presentationId: string) => `/presentations/${presentationId}/slots`,
  },
  proofOfPlay: {
    base: "/proof-of-play",
    export: "/proof-of-play/export",
  },
  reports: {
    summary: "/reports/summary",
    trends: "/reports/trends",
    requestsByDepartment: "/reports/requests-by-department",
    offlineScreens: "/reports/offline-screens",
    storage: "/reports/storage",
    systemHealth: "/health",
  },
  requests: {
    base: "/requests",
    byId: (requestId: string) => `/requests/${requestId}`,
    messages: (requestId: string) => `/requests/${requestId}/messages`,
  },
  schedules: {
    base: "/schedules",
    byId: (scheduleId: string) => `/schedules/${scheduleId}`,
    publish: (scheduleId: string) => `/schedules/${scheduleId}/publish`,
    items: (scheduleId: string) => `/schedules/${scheduleId}/items`,
    publishById: (publishId: string) => `/publishes/${publishId}`,
    publishesForSchedule: (scheduleId: string) => `/schedules/${scheduleId}/publishes`,
    publishTarget: (publishId: string, targetId: string) => `/publishes/${publishId}/targets/${targetId}`,
  },
  scheduleRequests: {
    base: "/schedule-requests",
  },
  screens: {
    base: "/screens",
    byId: (screenId: string) => `/screens/${screenId}`,
    groups: "/screen-groups",
    groupById: (groupId: string) => `/screen-groups/${groupId}`,
    aspectRatios: "/screens/aspect-ratios",
  },
  settings: {
    base: "/settings",
  },
  ssoConfig: {
    base: "/sso-config",
    deactivate: (id: string) => `/sso-config/${id}/deactivate`,
  },
  users: {
    base: "/users",
    invite: "/users/invite",
    activate: "/users/activate",
    resetPassword: (userId: string) => `/users/${userId}/reset-password`,
    byId: (userId: string) => `/users/${userId}`,
  },
  webhooks: {
    base: "/webhooks",
    byId: (webhookId: string) => `/webhooks/${webhookId}`,
    test: (webhookId: string) => `/webhooks/${webhookId}/test`,
  },
} as const;
