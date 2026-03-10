import type {
  ScreenNowPlayingResponse,
  ScreenOverviewItem,
  ScreenRefreshRequiredEvent,
  ScreensOverview,
  ScreensSyncAck,
} from "@/api/types";

export const SCREENS_STALE_HEARTBEAT_MS = 2 * 60 * 1000;
export const SCREENS_REFRESH_DEBOUNCE_MS = 500;

export const patchScreenInOverview = (
  current: ScreensOverview | undefined,
  screen: ScreenOverviewItem,
  serverTime?: string,
) => {
  if (!current) return current;
  const nextScreens = current.screens.map((item) => (item.id === screen.id ? { ...item, ...screen } : item));
  const hasMatch = nextScreens.some((item) => item.id === screen.id);
  return {
    ...current,
    server_time: serverTime ?? current.server_time,
    screens: hasMatch ? nextScreens : [screen, ...current.screens],
  };
};

export const patchScreenNowPlaying = (
  current: ScreenNowPlayingResponse | undefined,
  screen: ScreenOverviewItem,
  serverTime?: string,
) => {
  if (!current || current.screen_id !== screen.id) return current;
  return {
    ...current,
    server_time: serverTime ?? current.server_time,
    status: screen.status ?? current.status,
    last_heartbeat_at: screen.last_heartbeat_at ?? current.last_heartbeat_at,
    current_schedule_id: screen.current_schedule_id ?? current.current_schedule_id,
    current_media_id: screen.current_media_id ?? current.current_media_id,
    active_items: screen.active_items ?? current.active_items,
    upcoming_items: screen.upcoming_items ?? current.upcoming_items,
    booked_until: screen.booked_until ?? current.booked_until,
    publish: screen.publish ?? current.publish,
    playback: screen.playback ?? current.playback,
    emergency: screen.emergency ?? current.emergency,
  };
};

export const applyScreensSyncAck = (
  current: ScreensOverview | undefined,
  ack: ScreensSyncAck,
) => {
  if (!current) {
    return {
      server_time: ack.server_time,
      screens: ack.screens,
      groups: ack.groups ?? [],
      now_playing: [],
    } satisfies ScreensOverview;
  }

  let next = {
    ...current,
    server_time: ack.server_time ?? current.server_time,
    groups: ack.groups ?? current.groups,
  };

  ack.screens.forEach((screen) => {
    next = patchScreenInOverview(next, screen, ack.server_time) ?? next;
  });

  return next;
};

export const shouldRefetchScreenDetail = (
  payload: ScreenRefreshRequiredEvent,
  screenId?: string | null,
) => {
  if (!screenId) return false;
  return Array.isArray(payload.screen_ids) && payload.screen_ids.includes(screenId);
};

export const getServerClockOffsetMs = (serverTime?: string | null, clientNow = Date.now()) => {
  if (!serverTime) return 0;
  const serverTimestamp = Date.parse(serverTime);
  if (Number.isNaN(serverTimestamp)) return 0;
  return serverTimestamp - clientNow;
};

export const getServerNowFromOffset = (offsetMs: number, clientNow = Date.now()) => clientNow + offsetMs;

export const isHeartbeatStale = (
  lastHeartbeatAt?: string | null,
  serverTime?: string | null,
  thresholdMs = SCREENS_STALE_HEARTBEAT_MS,
) => {
  if (!lastHeartbeatAt || !serverTime) return false;
  const lastHeartbeatMs = Date.parse(lastHeartbeatAt);
  const serverMs = Date.parse(serverTime);
  if (Number.isNaN(lastHeartbeatMs) || Number.isNaN(serverMs)) return false;
  return serverMs - lastHeartbeatMs > thresholdMs;
};

export const getPlaybackTimingLabel = (
  startedAt?: string | null,
  endsAt?: string | null,
  serverNowMs?: number,
) => {
  if (!startedAt && !endsAt) return null;
  const startedMs = startedAt ? Date.parse(startedAt) : NaN;
  const endsMs = endsAt ? Date.parse(endsAt) : NaN;

  if (serverNowMs && !Number.isNaN(endsMs)) {
    const remainingMs = Math.max(0, endsMs - serverNowMs);
    const remainingMinutes = Math.floor(remainingMs / 60_000);
    const remainingSeconds = Math.floor((remainingMs % 60_000) / 1000);
    return `Ends in ${remainingMinutes}m ${remainingSeconds}s`;
  }

  if (!Number.isNaN(startedMs)) {
    return `Started ${new Date(startedMs).toLocaleTimeString()}`;
  }

  return `Ends ${new Date(endsMs).toLocaleTimeString()}`;
};
