export type Role = "ADMIN" | "OPERATOR" | "DEPARTMENT";

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: Role;
  department_id?: string | null;
  is_active?: boolean;
}

export interface AuthResponse {
  token?: string;
  csrf_token?: string;
  expiresAt?: string;
  user: User;
}

export interface PaginationParams extends Record<string, string | number | boolean | undefined | null> {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ApiKey {
  id: string;
  name: string;
  roles?: Role[];
  scopes?: string[];
  expires_at?: string | null;
  secret?: string;
  created_at?: string;
  revoked_at?: string | null;
}

export interface Webhook {
  id: string;
  name: string;
  event_types: string[];
  target_url: string;
  headers?: Record<string, string>;
  is_active?: boolean;
}

export interface SsoConfig {
  id: string;
  provider: string;
  issuer: string;
  client_id: string;
  client_secret?: string;
  authorization_url?: string;
  token_url?: string;
  jwks_url?: string;
  redirect_uri?: string;
  scopes?: string[];
  is_active?: boolean;
}

export interface OrgSetting {
  key: string;
  value: unknown;
}

export interface Conversation {
  id: string;
  participant_id: string;
}

export interface ConversationMessage {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  attachments?: string[];
}

export interface ProofOfPlay {
  id: string;
  screen_id: string;
  media_id: string;
  schedule_id?: string;
  status: "COMPLETED" | "INCOMPLETE";
  played_at: string;
}

export interface ProofOfPlayFilters extends PaginationParams {
  screen_id?: string;
  media_id?: string;
  schedule_id?: string;
  start?: string;
  end?: string;
  status?: "COMPLETED" | "INCOMPLETE";
  include_url?: boolean;
  group_by?: "day" | "screen" | "media";
}

export interface ReportSummary {
  uptime?: number;
  total_media?: number;
  open_requests?: number;
  completed_requests?: number;
  active_screens?: number;
  offline_screens?: number;
}

export interface MetricsOverview {
  totals?: Record<string, number>;
  proof_of_play?: Record<string, number>;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  resource_type?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface Notification {
  id: string;
  title?: string;
  body?: string;
  read?: boolean;
  created_at?: string;
}

export interface Presentation {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScreenGroup {
  id: string;
  name: string;
  description?: string | null;
}

export interface DevicePairing {
  id: string;
  pairing_code?: string;
  device_id?: string;
  status?: string;
  created_at?: string;
}

export interface DeviceCommand {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
  status?: string;
  created_at?: string;
}

export interface EmergencyStatus {
  id: string;
  status: string;
  triggered_at?: string;
}

export interface Screen {
  id: string;
  name: string;
  location?: string | null;
  status?: string;
  last_heartbeat_at?: string | null;
}

export interface MediaAsset {
  id: string;
  filename: string;
  content_type?: string;
  size?: number;
  status?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  ready_object_id?: string | null;
  thumbnail_object_id?: string | null;
  source_bucket?: string;
  source_key?: string;
}

export interface Schedule {
  id: string;
  name: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  is_active?: boolean;
}

export interface Publish {
  id: string;
  schedule_id: string;
  snapshot_id?: string;
  targets?: Array<{ id: string; status: string; error?: string | null }>;
}

export interface RequestTicket {
  id: string;
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  status?: string;
  assigned_to?: string | null;
}
