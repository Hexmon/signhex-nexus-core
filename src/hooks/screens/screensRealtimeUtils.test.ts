import { describe, expect, test } from "vitest";
import type { ScreenNowPlayingResponse, ScreenOverviewItem, ScreensOverview } from "@/api/types";
import {
  applyScreensSyncAck,
  getServerClockOffsetMs,
  getServerNowFromOffset,
  patchScreenInOverview,
  patchScreenNowPlaying,
  SCREENS_REFRESH_DEBOUNCE_MS,
  shouldRefetchScreenDetail,
} from "@/hooks/screens/screensRealtimeUtils";

const baseScreen: ScreenOverviewItem = {
  id: "screen-1",
  name: "Lobby",
  status: "ACTIVE",
  playback: {
    source: "HEARTBEAT",
    current_media_id: "media-1",
  },
};

describe("screens realtime cache helpers", () => {
  test("patchScreenInOverview updates only the matching row", () => {
    const current: ScreensOverview = {
      server_time: "2026-03-10T07:15:00.000Z",
      screens: [
        baseScreen,
        { id: "screen-2", name: "Hallway", status: "OFFLINE" },
      ],
      groups: [],
      now_playing: [],
    };

    const next = patchScreenInOverview(current, {
      ...baseScreen,
      playback: { source: "EMERGENCY", current_media_id: "media-2" },
    }, "2026-03-10T07:15:05.000Z");

    expect(next?.server_time).toBe("2026-03-10T07:15:05.000Z");
    expect(next?.screens[0].playback?.source).toBe("EMERGENCY");
    expect(next?.screens[1].status).toBe("OFFLINE");
  });

  test("patchScreenNowPlaying updates detail only when ids match", () => {
    const current: ScreenNowPlayingResponse = {
      server_time: "2026-03-10T07:15:00.000Z",
      screen_id: "screen-1",
      status: "ACTIVE",
      playback: { source: "HEARTBEAT", current_media_id: "media-1" },
    };

    const next = patchScreenNowPlaying(current, {
      ...baseScreen,
      status: "OFFLINE",
      playback: { source: "DEFAULT", current_media_id: "media-3" },
    }, "2026-03-10T07:16:00.000Z");

    expect(next?.status).toBe("OFFLINE");
    expect(next?.playback?.source).toBe("DEFAULT");
    expect(next?.server_time).toBe("2026-03-10T07:16:00.000Z");
  });

  test("applyScreensSyncAck merges synced screens and groups", () => {
    const current: ScreensOverview = {
      server_time: "2026-03-10T07:15:00.000Z",
      screens: [baseScreen],
      groups: [{ id: "group-1", name: "North Wing" }],
      now_playing: [],
    };

    const next = applyScreensSyncAck(current, {
      server_time: "2026-03-10T07:17:00.000Z",
      screens: [
        {
          ...baseScreen,
          playback: { source: "SCHEDULE", current_media_id: "media-9" },
        },
      ],
      groups: [{ id: "group-2", name: "South Wing" }],
    });

    expect(next.server_time).toBe("2026-03-10T07:17:00.000Z");
    expect(next.groups[0].id).toBe("group-2");
    expect(next.screens[0].playback?.current_media_id).toBe("media-9");
  });

  test("shouldRefetchScreenDetail only matches affected screens", () => {
    expect(
      shouldRefetchScreenDetail({ reason: "PUBLISH", screen_ids: ["screen-1"] }, "screen-1"),
    ).toBe(true);
    expect(
      shouldRefetchScreenDetail({ reason: "PUBLISH", screen_ids: ["screen-2"] }, "screen-1"),
    ).toBe(false);
  });

  test("server clock helpers derive stable now values", () => {
    const clientNow = Date.parse("2026-03-10T07:14:55.000Z");
    const offset = getServerClockOffsetMs("2026-03-10T07:15:00.000Z", clientNow);
    const serverNow = getServerNowFromOffset(offset, clientNow);

    expect(offset).toBe(5_000);
    expect(serverNow).toBe(Date.parse("2026-03-10T07:15:00.000Z"));
  });

  test("refresh debounce constant remains at 500ms", () => {
    expect(SCREENS_REFRESH_DEBOUNCE_MS).toBe(500);
  });
});
