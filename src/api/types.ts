export type RoleId = string;
export type RoleName = string;

export interface RolePermissionGrant {
  action: string;
  subject: string;
}

export interface RolePermissions {
  inherits: RoleId[];
  grants: RolePermissionGrant[];
}

export interface Role {
  id: RoleId;
  name: RoleName;
  description: string | null;
  permissions: RolePermissions;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionsMetadata {
  actions: string[];
  subjects: string[];
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role_id: RoleId;
  role: RoleName;
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
  roles?: RoleName[];
  scopes?: string[];
  expires_at?: string | null;
  secret?: string;
  created_at?: string;
  revoked_at?: string | null;
}

export interface LayoutSlot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z?: number;
}

export interface LayoutSpec {
  slots: LayoutSlot[];
}

export interface LayoutItem {
  id: string;
  name: string;
  description: string;
  aspect_ratio: string;
  spec: LayoutSpec;
  created_at: string;
  updated_at: string;
}

export interface LayoutSummary {
  id: string;
  name: string;
  description?: string | null;
  aspect_ratio?: string;
  spec: LayoutSlot[] | LayoutSpec;
  created_at?: string;
  updated_at?: string;
}

export interface LayoutPagination {
  page: number;
  limit: number;
  total: number;
}

export interface LayoutListResponse {
  items: LayoutItem[];
  pagination: LayoutPagination;
}

export interface LayoutListParams extends PaginationParams {
  search?: string;
  aspect_ratio?: string;
}

export interface LayoutCreatePayload {
  name: string;
  description?: string;
  aspect_ratio: string;
  spec: LayoutSpec;
}

export type LayoutUpdatePayload = LayoutCreatePayload;

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

export interface DefaultMediaSetting {
  media_id: string | null;
  media?: MediaAsset | null;
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
  totals?: {
    users?: number;
    media?: number;
    screens?: number;
    requests?: number;
    [key: string]: number | undefined;
  };
  screens?: {
    total?: number;
    online_last_5m?: number;
    online?: number;
  };
  storage?: {
    media_bytes?: number;
  };
  schedules?: {
    active?: number;
  };
  proof_of_play?: Record<string, number>;
  system_health?: {
    status?: string;
    heartbeats?: {
      last_5m?: number;
      last_1h?: number;
    };
    last_heartbeat_at?: string | null;
    health_endpoint?: string;
  };
}

export interface HealthStatus {
  status: string;
  timestamp?: string;
}

export interface DepartmentRequestsReport {
  department_id: string | null;
  department_name: string | null;
  requests: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
  }>;
}

export interface OfflineScreensReport {
  count: number;
  screens: Array<{
    id: string;
    name: string;
    location?: string | null;
    last_heartbeat_at?: string | null;
    offline_hours?: number;
  }>;
}

export interface StorageReport {
  storage: {
    media_bytes: number;
    quota_bytes: number | null;
    quota_percent: number | null;
  };
  expiring_media?: {
    supported: boolean;
  };
}

export interface SystemHealthReport {
  transcode_queue?: {
    pending?: number;
  };
  publishes?: {
    last_published_at?: string | null;
  };
  jobs?: {
    failed_last_24h?: number;
  };
  operators?: {
    active?: number;
  };
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
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
  layout_id?: string;
  layout?: LayoutSummary;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export type PresentationFitMode = "cover" | "contain";

export interface PresentationSlotPayload {
  slot_id: string;
  media_id: string;
  order: number;
  duration_seconds: number;
  fit_mode: PresentationFitMode;
  audio_enabled: boolean;
}

export interface PresentationSlot {
  id: string;
  presentation_id: string;
  slot_id: string;
  media_id: string;
  order: number;
  duration_seconds: number;
  fit_mode: PresentationFitMode;
  audio_enabled: boolean;
  created_at?: string;
  media?: MediaAsset;
}

export interface Screen {
  id: string;
  name: string;
  location?: string | null;
  status?: string;
  is_active?: boolean;
  last_heartbeat_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScreenAspectRatio {
  id: string;
  name: string;
  aspect_ratio: string;
}

export interface ScreenAspectRatioListResponse {
  items: ScreenAspectRatio[];
}

export interface ScreenStatus {
  screen_id: string;
  status: "ACTIVE" | "OFFLINE" | "INACTIVE";
  last_heartbeat_at?: string | null;
  uptime_seconds?: number;
}

export interface NowPlaying {
  screen_id: string;
  media_id?: string;
  media_name?: string;
  started_at?: string;
  schedule_id?: string;
}

export interface ScreenAvailability {
  screen_id: string;
  is_available: boolean;
  current_schedule_id?: string | null;
  next_available_at?: string | null;
}

export interface ScreenSnapshotScheduleItem extends ScheduleItem {
  presentation?: Presentation & {
    items?: Array<{ id: string; media_id: string; duration_seconds?: number }>;
    slots?: unknown[];
  };
}

export interface ScreenSnapshot {
  screen_id?: string;
  group_id?: string;
  name?: string;
  description?: string;
  screen_ids?: string[];
  publish?: {
    publish_id?: string;
    schedule_id?: string;
    snapshot_id?: string;
    published_at?: string;
  } | null;
  snapshot?: {
    schedule?: {
      id?: string;
      start_at?: string;
      end_at?: string;
      items?: ScreenSnapshotScheduleItem[];
    };
    presentations?: Presentation[];
    layouts?: LayoutSummary[];
  } | null;
  media_urls?: Record<string, string>;
  emergency?: unknown;
  default_media?: unknown;
  snapshot_at?: string;
  current_media?: {
    id: string;
    name: string;
    url?: string;
  };
  schedule?: {
    id: string;
    name: string;
  };
}

export interface ScreenGroup {
  id: string;
  name: string;
  description?: string | null;
  screen_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ScreenGroupAvailability {
  group_id: string;
  available_count: number;
  total_count: number;
  screens: Array<{
    screen_id: string;
    is_available: boolean;
  }>;
}

export interface ScreenGroupNowPlaying {
  group_id: string;
  screens: Array<{
    screen_id: string;
    media_id?: string;
    media_name?: string;
  }>;
}

export interface ScreensOverview {
  screens: Screen[];
  groups: ScreenGroup[];
  now_playing: NowPlaying[];
  stats?: {
    total_screens: number;
    active_screens: number;
    offline_screens: number;
    total_groups: number;
  };
}

export interface DevicePairing {
  id: string;
  device_id?: string;
  pairing_code?: string;
  status?: "pending" | "used" | "expired";
  used_at?: string | null;
  expires_at?: string;
  created_at?: string;
}

export interface DevicePairingRequest {
  device_label: string;
  width: number;
  height: number;
  aspect_ratio: string;
  orientation: "landscape" | "portrait";
  model?: string;
  codecs?: string[];
  device_info?: Record<string, unknown>;
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

export type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT";

export interface MediaListParams extends PaginationParams {
  type?: MediaType;
  status?: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  name?: string;
  type?: MediaType;
  content_type?: string;
  source_content_type?: string;
  size?: number;
  status?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  ready_object_id?: string | null;
  thumbnail_object_id?: string | null;
  source_bucket?: string;
  source_key?: string;
  media_url?: string | null;
}

export interface Schedule {
  id: string;
  name: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  is_active?: boolean;
}

export interface ScheduleItemPayload {
  presentation_id: string;
  start_at: string;
  end_at: string;
  priority: number;
  screen_ids?: string[];
  screen_group_ids?: string[];
}

export interface ScheduleItem {
  id: string;
  schedule_id: string;
  presentation_id: string;
  start_at: string;
  end_at: string;
  priority: number;
  screen_ids?: string[];
  screen_group_ids?: string[];
  created_at?: string;
}

export interface ScheduleRequestPayload {
  schedule_id: string;
  notes?: string;
}

export interface ScheduleRequest {
  id: string;
  schedule_id: string;
  notes?: string | null;
  created_at?: string;
}

export type ScheduleRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED"
  | "EXPIRED"
  | string;

export interface ScheduleRequestUser {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role_id?: string;
  department_id?: string | null;
  department?: Department | null;
}

export interface ScheduleTimeStatus {
  now?: string;
  status?: string;
  is_expired?: boolean;
}

export interface ScheduleRequestListItem {
  id: string;
  status: ScheduleRequestStatus;
  notes?: string | null;
  review_notes?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  requested_by_user?: ScheduleRequestUser | null;
  reviewed_by_user?: ScheduleRequestUser | null;
  schedule?: Schedule | null;
  schedule_time_status?: ScheduleTimeStatus | null;
  schedule_items?: ScheduleItem[];
  presentations?: Presentation[];
  presentation_slots?: PresentationSlot[];
  media?: MediaAsset[];
  screens?: Screen[];
  screen_groups?: ScreenGroup[];
}

export interface ScheduleRequestPagination {
  page: number;
  limit: number;
  total: number;
}

export interface ScheduleRequestListResponse {
  items: ScheduleRequestListItem[];
  pagination: ScheduleRequestPagination;
}

export interface ScheduleRequestListParams extends PaginationParams {
  status?: ScheduleRequestStatus;
  include?: string;
}

export interface ScheduleRequestStatusSummary {
  counts: {
    pending: number;
    approved: number;
    rejected: number;
    published: number;
    expired: number;
  };
}

export interface DeviceScheduleItem {
  id: string;
  media_id: string;
  type: "image" | "video" | "pdf" | string;
  display_ms?: number;
  fit?: "cover" | "contain" | string;
  media_url?: string;
  sha256?: string;
  muted?: boolean;
  [key: string]: unknown;
}

export interface DeviceScheduleSnapshot {
  id: string;
  version?: number;
  generated_at?: string;
  fetched_at?: string;
  schedule?: {
    id?: string;
    version?: number;
    items?: DeviceScheduleItem[];
  };
  media_urls?: Record<string, string>;
  media?: Array<{
    media_id: string;
    url?: string;
    type?: string;
  }>;
  emergency?: unknown;
  default_media?: unknown;
}

export interface ScheduleRequestReviewResponse {
  id: string;
  status: ScheduleRequestStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string | null;
}

export interface ScheduleRequestPublishResponse {
  message?: string;
  schedule_request_id?: string;
  schedule_id?: string;
  publish_id?: string;
  snapshot_id?: string;
  resolved_screen_ids?: string[];
  targets?: number;
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
