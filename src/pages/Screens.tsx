import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Eye,
  Flame,
  HeartPulse,
  MapPin,
  Monitor,
  Pencil,
  Plus,
  Power,
  QrCode,
  RadioTower,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { screensApi } from "@/api/domains/screens";
import { devicePairingApi } from "@/api/domains/devicePairing";
import type { DevicePairing, ScreenGroup, ScreenOverviewItem } from "@/api/types";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { PageNavigation } from "@/components/common/PageNavigation";
import { queryKeys } from "@/api/queryKeys";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { PairDeviceModal } from "@/components/screens/PairDeviceModal";
import { ScreenDetailsModal } from "@/components/screens/ScreenDetailsModal";
import { toast } from "sonner";
import { CreateGroupModal } from "@/components/screens/CreateGroupModal";
import { UpdateGroupModal } from "@/components/screens/UpdateGroupModal";
import { useScreensRealtime } from "@/hooks/screens/useScreensRealtime";
import {
  getPlaybackTimingLabel,
  getServerClockOffsetMs,
  getServerNowFromOffset,
  isHeartbeatStale,
} from "@/hooks/screens/screensRealtimeUtils";

const PAGE_SIZE = 9;

const HEALTH_PRIORITY: Record<string, number> = {
  RECOVERY_REQUIRED: 0,
  ERROR: 1,
  STALE: 2,
  OFFLINE: 3,
  ONLINE: 4,
};

const getFallbackPlaybackLabel = (screen: ScreenOverviewItem) => {
  if (screen.playback?.source === "EMERGENCY") return "Emergency takeover is active";
  if (screen.status === "OFFLINE") return "Screen is offline";
  if (!screen.publish && screen.playback?.source === "DEFAULT") return "Default media fallback";
  if (!screen.publish && screen.playback?.source === "UNKNOWN") return "Nothing currently scheduled";
  return "Waiting for live playback";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "N/A";
  return new Date(timestamp).toLocaleString();
};

export default function Screens() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [recoveryScreenId, setRecoveryScreenId] = useState<string | null>(null);
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [page, setPage] = useState(1);

  const overviewQuery = useQuery({
    queryKey: queryKeys.screensOverview({ includeMedia: true }),
    queryFn: () => screensApi.getOverview({ include_media: true }),
  });

  const { data: pairingsData } = useQuery({
    queryKey: ["device-pairings"],
    queryFn: () => devicePairingApi.list({ page: 1, limit: 10 }),
  });

  const screens = useMemo(() => overviewQuery.data?.screens ?? [], [overviewQuery.data?.screens]);
  const screenGroups = useMemo(() => overviewQuery.data?.groups ?? [], [overviewQuery.data?.groups]);
  const pairings = useMemo(() => pairingsData?.items ?? [], [pairingsData]);
  const selectedScreen = useMemo(
    () => screens.find((screen) => screen.id === selectedScreenId) ?? null,
    [screens, selectedScreenId],
  );
  const recoveryScreen = useMemo(
    () => screens.find((screen) => screen.id === recoveryScreenId) ?? null,
    [recoveryScreenId, screens],
  );

  useEffect(() => {
    setServerClockOffsetMs(getServerClockOffsetMs(overviewQuery.data?.server_time));
  }, [overviewQuery.data?.server_time]);

  useEffect(() => {
    const interval = window.setInterval(() => setClockTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const serverNowMs = useMemo(
    () => getServerNowFromOffset(serverClockOffsetMs, clockTick),
    [clockTick, serverClockOffsetMs],
  );

  const { rejectedScreenIds, pendingEmergencyScreenIds } = useScreensRealtime({
    activeScreenId: selectedScreenId,
    enabled: true,
  });

  const deleteScreen = useSafeMutation({
    mutationFn: (id: string) => screensApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.screens });
      queryClient.invalidateQueries({ queryKey: queryKeys.screensOverview({ includeMedia: true }) });
      toast.success("Screen deleted successfully");
    },
  }, "Unable to delete screen.");

  const deleteGroup = useSafeMutation({
    mutationFn: (id: string) => screensApi.removeGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.screenGroups });
      queryClient.invalidateQueries({ queryKey: ["available-screens"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.screens });
      queryClient.invalidateQueries({ queryKey: queryKeys.screensOverview({ includeMedia: true }) });
      toast.success("Group deleted successfully");
    },
  }, "Unable to delete group.");

  const filteredScreens = useMemo(
    () =>
      screens.filter((screen) => {
        const q = search.toLowerCase();
        const { name = "", location = "", id = "" } = screen;
        return (
          q === "" ||
          name.toLowerCase().includes(q) ||
          location.toLowerCase().includes(q) ||
          id.toLowerCase().includes(q)
        );
      }),
    [screens, search],
  );
  const totalPages = Math.max(1, Math.ceil(filteredScreens.length / PAGE_SIZE));
  const paginatedScreens = useMemo(
    () => filteredScreens.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredScreens, page],
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const stats = useMemo(() => {
    const total = screens.length;
    const online = screens.filter((screen) => screen.health_state === "ONLINE").length;
    const recovery = screens.filter((screen) => screen.health_state === "RECOVERY_REQUIRED").length;
    const stale = screens.filter((screen) => screen.health_state === "STALE").length;
    const offline = screens.filter((screen) => screen.health_state === "OFFLINE").length;
    return { total, online, recovery, stale, offline };
  }, [screens]);

  const handleDeleteScreen = (screenId: string) => {
    deleteScreen.mutate(screenId);
  };

  const handleDeleteGroup = (groupId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteGroup.mutate(groupId);
  };

  const handleEditGroup = (groupId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedGroupId(groupId);
  };

  const screensErrorMessage =
    overviewQuery.error instanceof Error ? overviewQuery.error.message : "Unable to load screens.";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Screens"
        description="Manage and monitor all display screens across locations"
        actionLabel="Pair Device"
        actionIcon={<QrCode className="h-4 w-4" />}
        onAction={() => {
          setRecoveryScreenId(null);
          setIsPairModalOpen(true);
        }}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Screens"
          value={stats.total}
          icon={<Monitor className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Online"
          value={stats.online}
          icon={<Power className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          title="Offline"
          value={stats.offline}
          icon={<Power className="h-5 w-5 text-red-600" />}
        />
        <StatCard
          title="Recovery"
          value={stats.recovery}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          title="Stale"
          value={stats.stale}
          icon={<HeartPulse className="h-5 w-5 text-yellow-600" />}
        />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <SearchBar
              placeholder="Search screens by name, location, or ID..."
              onSearch={setSearch}
              initialValue={search}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {overviewQuery.isFetching ? "Refreshing live playback..." : `${filteredScreens.length} screens`}
          </div>
        </div>
      </Card>

      {overviewQuery.isLoading && !overviewQuery.data ? (
        <LoadingIndicator fullScreen label="Loading screens..." />
      ) : overviewQuery.isError && !overviewQuery.data ? (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Unable to load screens</p>
              <p className="text-sm text-muted-foreground">{screensErrorMessage}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => overviewQuery.refetch()}
            className="w-fit"
          >
            Retry
          </Button>
        </Card>
      ) : filteredScreens.length === 0 ? (
        <EmptyState
          title="No screens found"
          description="Try adjusting your search or pair a device from the player first."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedScreens.map((screen) => {
            const { id, name, location, status, last_heartbeat_at, playback, publish, active_items, upcoming_items, health_state, health_reason, auth_diagnostics, active_pairing } = screen;
            const isEmergency = pendingEmergencyScreenIds.includes(id) || playback?.source === "EMERGENCY";
            const isOffline = health_state === "OFFLINE" || status === "OFFLINE";
            const hasStaleHeartbeat = isHeartbeatStale(last_heartbeat_at, overviewQuery.data?.server_time);
            const playbackLabel =
              playback?.current_media?.name ||
              playback?.current_media_id ||
              getFallbackPlaybackLabel(screen);
            const timingLabel = getPlaybackTimingLabel(
              playback?.started_at,
              playback?.ends_at,
              serverNowMs,
            );
            const healthBadge = health_state || status || "offline";
            const healthRank = HEALTH_PRIORITY[health_state || ""] ?? 99;

            return (
              <Card key={id} className="p-5 hover:shadow-lg transition-shadow space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${
                        isEmergency
                          ? "bg-red-500/10 text-red-600"
                          : healthRank === 0 || healthRank === 1
                            ? "bg-red-500/10 text-red-600"
                            : isOffline
                            ? "bg-red-500/10 text-red-600"
                            : health_state === "ONLINE"
                              ? "bg-green-500/10 text-green-600"
                            : "bg-yellow-500/10 text-yellow-600"
                      }`}
                    >
                      {isEmergency ? <Flame className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{name}</h3>
                      <p className="text-xs text-muted-foreground font-mono truncate">{id}</p>
                    </div>
                  </div>
                  <StatusBadge status={String(healthBadge).toLowerCase()} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {isEmergency && <Badge variant="destructive">Emergency</Badge>}
                  {playback?.source && <Badge variant="outline">{playback.source}</Badge>}
                  {active_pairing?.mode === "RECOVERY" && (
                    <Badge variant="outline" className="border-amber-500 text-amber-700">
                      Recovery pending
                    </Badge>
                  )}
                  {hasStaleHeartbeat && !isOffline && (
                    <Badge variant="outline" className="border-amber-500 text-amber-700">
                      Delayed heartbeat
                    </Badge>
                  )}
                  {!publish && playback?.source === "DEFAULT" && (
                    <Badge variant="outline">Default fallback</Badge>
                  )}
                  {!publish && playback?.source === "UNKNOWN" && (
                    <Badge variant="outline">Nothing scheduled</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{location || "Unassigned"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <RadioTower className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{playbackLabel}</p>
                      <p className="text-xs">{timingLabel || "Waiting for next playback change"}</p>
                    </div>
                  </div>
                  <div className="text-xs">
                    Health: <span className="font-medium text-foreground">{health_state || status || "UNKNOWN"}</span>
                  </div>
                  {health_reason ? (
                    <div className="text-xs text-muted-foreground">{health_reason}</div>
                  ) : null}
                  {auth_diagnostics?.reason ? (
                    <div className="text-xs text-muted-foreground">Auth: {auth_diagnostics.reason}</div>
                  ) : null}
                  <div className="text-xs">
                    Last heartbeat: {formatDateTime(last_heartbeat_at)}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span>Active items: {active_items?.length ?? 0}</span>
                    <span>Upcoming: {upcoming_items?.length ?? 0}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedScreenId(id)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRecoveryScreenId(id);
                      setIsPairModalOpen(true);
                    }}
                  >
                    <QrCode className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteScreen(id)}
                    disabled={deleteScreen.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            );
            })}
          </div>
          <PageNavigation currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Screen Groups</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsGroupModalOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Group
            </Button>
          </div>

          <div className="divide-y rounded-md border max-h-72 overflow-auto">
            {screenGroups.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No groups yet. Create one to organize your screens.
              </div>
            ) : (
              <>
                {screenGroups.map((group: ScreenGroup) => {
                  const { id, name, description, screen_ids, booked_until, active_items, upcoming_items } = group;

                  return (
                    <div
                      key={id}
                      className="px-3 py-2 flex items-center justify-between hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {description || "No description"}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{screen_ids?.length || 0} screens</span>
                          <span>Active {active_items?.length ?? 0}</span>
                          <span>Upcoming {upcoming_items?.length ?? 0}</span>
                        </div>
                        {booked_until && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Booked until: {formatDateTime(booked_until)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(event) => handleEditGroup(id, event)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(event) => handleDeleteGroup(id, event)}
                          disabled={deleteGroup.isPending}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Device Pairings</h2>
            </div>
            <Button size="sm" onClick={() => setIsPairModalOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Pair Device
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            View all device pairing records for first-time pairing and same-screen recovery.
          </p>

          <div className="divide-y rounded-md border max-h-72 overflow-auto">
            {pairings.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No pairings yet. Generate a code to pair a new device.
              </div>
            ) : (
              <>
                {pairings.map((pair: DevicePairing) => {
                  const { id, pairing_code, status, device_id, expires_at, used_at, created_at } = pair;

                  return (
                    <div key={id} className="px-3 py-2 space-y-1 hover:bg-accent">
                      <div className="flex items-center justify-between">
                        <p className="font-medium font-mono text-sm">{pairing_code || "—"}</p>
                        <Badge
                          variant={
                            status === "used" ? "default" :
                              status === "expired" ? "destructive" :
                                "secondary"
                          }
                          className="text-[10px]"
                        >
                          {status || "pending"}
                        </Badge>
                      </div>
                      {pair.recovery?.mode ? (
                        <p className="text-xs text-muted-foreground">
                          Mode: <span className="font-medium">{pair.recovery.mode}</span>
                        </p>
                      ) : null}
                      {device_id && (
                        <p className="text-xs text-muted-foreground">
                          Device: <span className="font-mono">{device_id}</span>
                        </p>
                      )}
                      <div className="text-[10px] text-muted-foreground space-y-0.5">
                        {created_at && <p>Created: {formatDateTime(created_at)}</p>}
                        {used_at && <p>Used: {formatDateTime(used_at)}</p>}
                        {expires_at && status !== "used" && <p>Expires: {formatDateTime(expires_at)}</p>}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </Card>
      </div>

      <PairDeviceModal
        open={isPairModalOpen}
        onOpenChange={(open) => {
          setIsPairModalOpen(open);
          if (!open) {
            setRecoveryScreenId(null);
          }
        }}
        recoveryScreen={recoveryScreen}
      />

      <CreateGroupModal open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen} />

      {selectedGroupId && (
        <UpdateGroupModal
          groupId={selectedGroupId}
          open={Boolean(selectedGroupId)}
          onOpenChange={(open) => !open && setSelectedGroupId(null)}
        />
      )}

      {selectedScreenId && (
        <ScreenDetailsModal
          screenId={selectedScreenId}
          screenName={selectedScreen?.name}
          open={Boolean(selectedScreenId)}
          realtimeRejected={rejectedScreenIds.includes(selectedScreenId)}
          pendingEmergency={pendingEmergencyScreenIds.includes(selectedScreenId)}
          onOpenChange={(open) => !open && setSelectedScreenId(null)}
        />
      )}
    </div>
  );
}
