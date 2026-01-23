export const ROUTES = {
  home: "/",
  login: "/login",
  dashboard: "/dashboard",
  schedule: "/schedule",
  requests: "/requests",
  departments: "/departments",
  operators: "/operators",
  users: "/users",
  conversations: "/conversations",
  screens: "/screens",
  media: "/media",
  reports: "/reports",
  settings: "/settings",
  apiKeys: "/api-keys",
  webhooks: "/webhooks",
  ssoConfig: "/sso-config",
  proofOfPlay: "/proof-of-play",
} as const;

export const STORAGE_KEYS = {
  postLoginRedirect: "postLoginRedirect",
} as const;
