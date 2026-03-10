import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  ScreenRefreshRequiredEvent,
  ScreensSubscribeAck,
  ScreensSyncAck,
  ScreenStateUpdateEvent,
} from "@/api/types";
import { queryKeys } from "@/api/queryKeys";
import { screensApi } from "@/api/domains/screens";
import { connectScreensSocket } from "@/lib/screensSocket";
import { useAppSelector } from "@/store/hooks";
import {
  applyScreensSyncAck,
  patchScreenInOverview,
  patchScreenNowPlaying,
  SCREENS_REFRESH_DEBOUNCE_MS,
  shouldRefetchScreenDetail,
} from "@/hooks/screens/screensRealtimeUtils";

interface UseScreensRealtimeOptions {
  enabled?: boolean;
  activeScreenId?: string | null;
}

export const useScreensRealtime = ({
  enabled = true,
  activeScreenId,
}: UseScreensRealtimeOptions) => {
  const queryClient = useQueryClient();
  const authToken = useAppSelector((state) => state.auth.token);
  const [isConnected, setIsConnected] = useState(false);
  const [rejectedScreenIds, setRejectedScreenIds] = useState<string[]>([]);
  const [pendingEmergencyScreenIds, setPendingEmergencyScreenIds] = useState<string[]>([]);
  const refreshTimeoutRef = useRef<number | null>(null);

  const detailQueryKey = useMemo(
    () => queryKeys.screenNowPlaying(activeScreenId ?? undefined, { includeMedia: true, includeUrls: false }),
    [activeScreenId],
  );

  useEffect(() => {
    if (!enabled || !authToken) {
      setIsConnected(false);
      setRejectedScreenIds([]);
      setPendingEmergencyScreenIds([]);
      return;
    }

    const socket = connectScreensSocket(authToken);
    if (!socket) return;

    const refetchOverview = () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.screensOverview({ includeMedia: true }) });

    const refetchDetail = () => {
      if (!activeScreenId) return Promise.resolve();
      return queryClient.invalidateQueries({ queryKey: detailQueryKey });
    };

    const runSync = () => {
      socket.emit(
        "screens:sync",
        activeScreenId ? { screenIds: [activeScreenId] } : undefined,
        (ack?: ScreensSyncAck) => {
          if (!ack) {
            void refetchOverview();
            void refetchDetail();
            return;
          }

          queryClient.setQueryData(queryKeys.screensOverview({ includeMedia: true }), (current: ScreensSyncAck | undefined) =>
            applyScreensSyncAck(current as never, ack),
          );

          if (activeScreenId) {
            const matchedScreen = ack.screens.find((screen) => screen.id === activeScreenId);
            if (matchedScreen) {
              queryClient.setQueryData(detailQueryKey, (current: ReturnType<typeof patchScreenNowPlaying>) =>
                patchScreenNowPlaying(current as never, matchedScreen, ack.server_time),
              );
            }
          }
        },
      );
    };

    const subscribe = () => {
      socket.emit(
        "screens:subscribe",
        {
          includeAll: true,
          screenIds: activeScreenId ? [activeScreenId] : [],
        },
        (ack?: ScreensSubscribeAck) => {
          setRejectedScreenIds(Array.isArray(ack?.rejected) ? ack.rejected : []);
        },
      );
    };

    const onConnect = () => {
      setIsConnected(true);
      subscribe();
      runSync();
      void refetchOverview();
      void refetchDetail();
    };

    const onReconnect = () => {
      setIsConnected(true);
      subscribe();
      runSync();
      void refetchOverview();
      void refetchDetail();
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = () => {
      setIsConnected(false);
      void refetchOverview();
      void refetchDetail();
    };

    const onStateUpdate = (payload: ScreenStateUpdateEvent) => {
      queryClient.setQueryData(queryKeys.screensOverview({ includeMedia: true }), (current: ReturnType<typeof patchScreenInOverview>) =>
        patchScreenInOverview(current as never, payload.screen, payload.server_time),
      );

      if (activeScreenId === payload.screen.id) {
        queryClient.setQueryData(detailQueryKey, (current: ReturnType<typeof patchScreenNowPlaying>) =>
          patchScreenNowPlaying(current as never, payload.screen, payload.server_time),
        );
      }
    };

    const onRefreshRequired = (payload: ScreenRefreshRequiredEvent) => {
      if (payload.reason === "EMERGENCY" && Array.isArray(payload.screen_ids)) {
        setPendingEmergencyScreenIds(payload.screen_ids);
      }

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        const tasks: Array<Promise<unknown>> = [refetchOverview()];
        if (shouldRefetchScreenDetail(payload, activeScreenId)) {
          tasks.push(refetchDetail());
        }

        void Promise.allSettled(tasks).finally(() => {
          if (payload.reason === "EMERGENCY" && Array.isArray(payload.screen_ids)) {
            setPendingEmergencyScreenIds((current) =>
              current.filter((screenId) => !payload.screen_ids?.includes(screenId)),
            );
          }
        });
      }, SCREENS_REFRESH_DEBOUNCE_MS);
    };

    socket.on("connect", onConnect);
    socket.on("reconnect", onReconnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("screens:state:update", onStateUpdate);
    socket.on("screens:refresh:required", onRefreshRequired);

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      socket.off("connect", onConnect);
      socket.off("reconnect", onReconnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("screens:state:update", onStateUpdate);
      socket.off("screens:refresh:required", onRefreshRequired);
    };
  }, [activeScreenId, authToken, detailQueryKey, enabled, queryClient]);

  return {
    isConnected,
    rejectedScreenIds,
    pendingEmergencyScreenIds,
  };
};
