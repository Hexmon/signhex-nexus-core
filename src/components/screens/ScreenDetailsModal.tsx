import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Clock,
  Edit2,
  Flame,
  MapPin,
  Monitor,
  RadioTower,
  RefreshCcw,
  Save,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { screensApi } from "@/api/domains/screens";
import { queryKeys } from "@/api/queryKeys";
import type { ScreenPlaybackItemSummary } from "@/api/types";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { toast } from "sonner";
import { ApiError } from "@/api/apiClient";
import { getPlaybackTimingLabel, getServerClockOffsetMs, getServerNowFromOffset, isHeartbeatStale } from "@/hooks/screens/screensRealtimeUtils";
import { maskCertificateSerial } from "@/lib/screens";

interface ScreenDetailsModalProps {
  screenId: string;
  screenName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  realtimeRejected?: boolean;
  pendingEmergency?: boolean;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "N/A";
  return new Date(timestamp).toLocaleString();
};

const getItemSummaryMediaLabel = (item: ScreenPlaybackItemSummary) => {
  if (!item.media.length) return "No media attached";
  return item.media
    .map((media) => {
      const name = media.name || media.id;
      return media.type ? `${name} (${media.type})` : name;
    })
    .join(", ");
};

export function ScreenDetailsModal({
  screenId,
  screenName,
  open,
  onOpenChange,
  realtimeRejected = false,
  pendingEmergency = false,
}: ScreenDetailsModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", location: "" });
  const [serverClockOffsetMs, setServerClockOffsetMs] = useState(0);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [pendingSnapshotCapture, setPendingSnapshotCapture] = useState<{
    startedAt: number;
    previousCapturedAt: string | null;
  } | null>(null);

  const screenQuery = useQuery({
    queryKey: ["screen", screenId],
    queryFn: () => screensApi.getById(screenId),
    enabled: open,
  });

  const nowPlayingQuery = useQuery({
    queryKey: queryKeys.screenNowPlaying(screenId, { includeMedia: true, includeUrls: false, includePreview: true }),
    queryFn: () => screensApi.getNowPlaying(screenId, { include_media: true, include_preview: true }),
    enabled: open && !realtimeRejected,
  });

  const availabilityQuery = useQuery({
    queryKey: ["screen-availability", screenId],
    queryFn: () => screensApi.getAvailability(screenId),
    enabled: open,
  });

  const snapshotQuery = useQuery({
    queryKey: queryKeys.screenSnapshot(screenId),
    queryFn: () => screensApi.getSnapshot(screenId, true),
    enabled: open,
  });

  useEffect(() => {
    const interval = window.setInterval(() => setClockTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setServerClockOffsetMs(getServerClockOffsetMs(nowPlayingQuery.data?.server_time));
  }, [nowPlayingQuery.data?.server_time]);

  const serverNowMs = useMemo(
    () => getServerNowFromOffset(serverClockOffsetMs, clockTick),
    [clockTick, serverClockOffsetMs],
  );

  const updateScreen = useSafeMutation({
    mutationFn: (payload: { name: string; location?: string }) => screensApi.update(screenId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screen", screenId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.screens });
      queryClient.invalidateQueries({ queryKey: queryKeys.screensOverview({ includeMedia: true }) });
      queryClient.invalidateQueries({ queryKey: queryKeys.screensOverview({ includeMedia: true, includePreview: true }) });
      setIsEditing(false);
      toast.success("Screen updated successfully");
    },
  }, "Unable to update screen.");

  const triggerScreenshot = useSafeMutation({
    mutationFn: () => screensApi.triggerScreenshot(screenId, { reason: "screen-details-modal" }),
    onSuccess: () => {
      setPendingSnapshotCapture({
        startedAt: Date.now(),
        previousCapturedAt:
          snapshotQuery.data?.preview?.captured_at ?? nowPlayingQuery.data?.preview?.captured_at ?? null,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.screenSnapshot(screenId) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.screenNowPlaying(screenId, { includeMedia: true, includeUrls: false, includePreview: true }),
      });
      toast.success("Snapshot requested");
    },
  }, "Unable to trigger screenshot.");

  const screen = screenQuery.data;
  const nowPlaying = nowPlayingQuery.data;
  const screenStatus = nowPlaying?.status || screen?.status || "UNKNOWN";
  const healthState = nowPlaying?.health_state || "UNKNOWN";
  const healthReason = nowPlaying?.health_reason || null;
  const authDiagnostics = nowPlaying?.auth_diagnostics || null;
  const activePairing = nowPlaying?.active_pairing || null;
  const isOffline = screenStatus === "OFFLINE";
  const hasStaleHeartbeat = isHeartbeatStale(nowPlaying?.last_heartbeat_at, nowPlaying?.server_time);
  const playback = nowPlaying?.playback;
  const currentMedia = playback?.current_media;
  const timingLabel = getPlaybackTimingLabel(playback?.started_at, playback?.ends_at, serverNowMs);
  const nowPlayingError = nowPlayingQuery.error instanceof ApiError ? nowPlayingQuery.error : null;
  const availability = availabilityQuery.data;
  const snapshot = snapshotQuery.data;
  const latestPreview = snapshot?.preview ?? nowPlaying?.preview ?? null;
  const activeItemSummaries = nowPlaying?.active_item_summaries ?? [];
  const upcomingItemSummaries = nowPlaying?.upcoming_item_summaries ?? [];
  const isTakingSnapshot = triggerScreenshot.isPending || Boolean(pendingSnapshotCapture);

  useEffect(() => {
    if (screen) {
      setEditForm({
        name: screen.name,
        location: screen.location || "",
      });
    }
  }, [screen]);

  useEffect(() => {
    if (!open && pendingSnapshotCapture) {
      setPendingSnapshotCapture(null);
    }
  }, [open, pendingSnapshotCapture]);

  useEffect(() => {
    if (!open || !pendingSnapshotCapture) return;

    let cancelled = false;
    const interval = window.setInterval(async () => {
      const snapshotResult = await snapshotQuery.refetch();
      const currentCapturedAt =
        snapshotResult.data?.preview?.captured_at ?? nowPlayingQuery.data?.preview?.captured_at ?? null;

      if (currentCapturedAt && currentCapturedAt !== pendingSnapshotCapture.previousCapturedAt) {
        if (!cancelled) {
          setPendingSnapshotCapture(null);
          void queryClient.invalidateQueries({
            queryKey: queryKeys.screensOverview({ includeMedia: true, includePreview: true }),
          });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.screenNowPlaying(screenId, { includeMedia: true, includeUrls: false, includePreview: true }),
          });
          toast.success("Snapshot updated");
        }
        return;
      }

      if (Date.now() - pendingSnapshotCapture.startedAt > 20_000 && !cancelled) {
        setPendingSnapshotCapture(null);
        toast.error("Snapshot capture is taking longer than expected.");
      }
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    nowPlayingQuery.data?.preview?.captured_at,
    open,
    pendingSnapshotCapture,
    queryClient,
    screenId,
    snapshotQuery.refetch,
  ]);

  const handleSave = () => {
    updateScreen.mutate({
      name: editForm.name.trim(),
      location: editForm.location.trim() || undefined,
    });
  };

  const initialLoading = (screenQuery.isLoading || nowPlayingQuery.isLoading) && !screen && !nowPlaying;

  if (initialLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const title = screen?.name || screenName || "Screen details";

  const renderUnavailableState = (
    titleText: string,
    description: string,
    retry?: () => void,
  ) => (
    <Card className="p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">{titleText}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {retry && (
          <Button variant="outline" onClick={retry}>
            Retry
          </Button>
        )}
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </div>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={editForm.name}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="text-lg font-semibold"
                  />
                ) : (
                  <>
                    <Monitor className="h-5 w-5" />
                    {title}
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="font-mono">{maskCertificateSerial(screenId)}</DialogDescription>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateScreen.isPending || !editForm.name.trim()}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {updateScreen.isPending ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  disabled={!screen}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {realtimeRejected ? (
          renderUnavailableState(
            "Live updates unavailable",
            "This screen subscription was rejected. The screen may have been removed or access may have changed.",
            () => nowPlayingQuery.refetch(),
          )
        ) : nowPlayingError?.status === 404 ? (
          renderUnavailableState(
            "Screen not found",
            "The selected screen no longer exists.",
          )
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="playing">Now Playing</TabsTrigger>
              <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {(pendingEmergency || playback?.source === "EMERGENCY") && (
                <Card className="border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <Flame className="h-4 w-4" />
                    <div>
                      <p className="font-semibold">Emergency content is active</p>
                      <p className="text-sm">This screen is currently showing emergency playback.</p>
                    </div>
                  </div>
                </Card>
              )}

              {nowPlayingError?.status === 500 && nowPlaying ? (
                <Card className="border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      <p className="text-sm">Live playback refresh failed. Showing the last known state.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => nowPlayingQuery.refetch()}>
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </Card>
              ) : null}

              <Card className="p-4 space-y-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Location</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.location}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, location: event.target.value }))}
                        placeholder="Enter location"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{screen?.location || "Not set"}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Health</Label>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={String(healthState).toLowerCase()} />
                      <Badge variant="outline">{screenStatus}</Badge>
                      {playback?.source && <Badge variant="outline">{playback.source}</Badge>}
                      {activePairing?.mode === "RECOVERY" ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-700">
                          Recovery pending
                        </Badge>
                      ) : null}
                      {hasStaleHeartbeat && !isOffline && (
                        <Badge variant="outline" className="border-amber-500 text-amber-700">
                          Delayed heartbeat
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Created</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      {formatDateTime(screen?.created_at)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      {formatDateTime(screen?.updated_at)}
                    </div>
                  </div>
                </div>
                {healthReason ? (
                  <div className="text-sm text-muted-foreground">
                    <Label className="text-muted-foreground">Health reason</Label>
                    <p className="mt-1">{healthReason}</p>
                  </div>
                ) : null}
                {authDiagnostics ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Auth diagnostics</Label>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{authDiagnostics.state || "UNKNOWN"}</p>
                        <p className="text-muted-foreground">{authDiagnostics.reason || "No authentication warnings."}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <Label className="text-muted-foreground">Certificate</Label>
                      <p>Serial: <span className="font-mono">{maskCertificateSerial(authDiagnostics.latest_certificate_serial)}</span></p>
                      <p>Expires: {formatDateTime(authDiagnostics.latest_certificate_expires_at)}</p>
                      <p>Revoked at: {formatDateTime(authDiagnostics.latest_certificate_revoked_at)}</p>
                    </div>
                  </div>
                ) : null}
              </Card>

              {availability && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Availability</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Current state</Label>
                      <p className="font-medium">
                        {availability.is_available_now ? "Available now" : "Booked right now"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Booked until</Label>
                      <p>{formatDateTime(availability.booked_until)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Published schedule</Label>
                      <p>{availability.publish?.schedule_name || "No active published schedule"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Current items</Label>
                      <p>{availability.current_item_summaries?.length ?? availability.current_items?.length ?? 0}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground">Next item</Label>
                      {availability.next_item_summary ? (
                        <div className="mt-1 rounded border p-3">
                          <p className="font-medium">
                            {availability.next_item_summary.presentation_name || "Scheduled presentation"}
                          </p>
                          <p className="text-muted-foreground">
                            {formatDateTime(availability.next_item_summary.start_at)} to{" "}
                            {formatDateTime(availability.next_item_summary.end_at)}
                          </p>
                          <p className="text-muted-foreground">
                            {getItemSummaryMediaLabel(availability.next_item_summary)}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1 text-muted-foreground">No upcoming booking</p>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="status">
              {nowPlaying ? (
                <Card className="p-4 space-y-3">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Live state</Label>
                      <p className="text-lg font-semibold">{screenStatus}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Health state</Label>
                      <p className="text-lg font-semibold">{healthState}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Playback source</Label>
                      <p className="text-lg font-semibold">{playback?.source || "UNKNOWN"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last heartbeat</Label>
                      <p className="text-sm">{formatDateTime(nowPlaying.last_heartbeat_at)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Booked until</Label>
                      <p className="text-sm">{formatDateTime(nowPlaying.booked_until)}</p>
                    </div>
                    {playback?.heartbeat_received_at && (
                      <div>
                        <Label className="text-muted-foreground">Heartbeat received</Label>
                        <p className="text-sm">{formatDateTime(playback.heartbeat_received_at)}</p>
                      </div>
                    )}
                    {playback?.last_proof_of_play_at && (
                      <div>
                        <Label className="text-muted-foreground">Last proof-of-play</Label>
                        <p className="text-sm">{formatDateTime(playback.last_proof_of_play_at)}</p>
                      </div>
                    )}
                    {activePairing?.mode && (
                      <div>
                        <Label className="text-muted-foreground">Active pairing</Label>
                        <p className="text-sm">{activePairing.mode}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <p className="text-center text-muted-foreground py-8">No status data available</p>
              )}
            </TabsContent>

            <TabsContent value="playing" className="space-y-4">
              {nowPlaying ? (
                <>
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <RadioTower className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">Live playback</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-muted-foreground">Current media</Label>
                        <p className="text-lg font-semibold">
                          {currentMedia?.name || playback?.current_media_id || "No media playing"}
                        </p>
                        {playback?.current_media_id && (
                          <p className="text-xs font-mono text-muted-foreground">
                            {playback.current_media_id}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-muted-foreground">Timing</Label>
                          <p className="text-sm">{timingLabel || "No active playback window"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Current schedule</Label>
                          <p className="text-sm">
                            {nowPlaying.current_schedule?.name || "No schedule currently active"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {currentMedia && (
                    <Card className="p-4 space-y-2">
                      <h3 className="font-semibold">Media details</h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
                        <div>
                          <Label className="text-muted-foreground">Type</Label>
                          <p>{currentMedia.type || "Unknown"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Content type</Label>
                          <p>{currentMedia.source_content_type || currentMedia.content_type || "Unknown"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Resolution</Label>
                          <p>
                            {currentMedia.width && currentMedia.height
                              ? `${currentMedia.width} x ${currentMedia.height}`
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Duration</Label>
                          <p>
                            {typeof currentMedia.duration_seconds === "number"
                              ? `${currentMedia.duration_seconds}s`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2">Active items</h3>
                      {activeItemSummaries.length ? (
                        <div className="space-y-2">
                          {activeItemSummaries.map((item) => (
                            <div key={item.item_id} className="rounded border p-3 text-sm space-y-1">
                              <p className="font-medium">{item.presentation_name || "Scheduled presentation"}</p>
                              {item.layout_name ? (
                                <p className="text-muted-foreground">Layout: {item.layout_name}</p>
                              ) : null}
                              <p className="text-muted-foreground">
                                {formatDateTime(item.start_at)} to {formatDateTime(item.end_at)}
                              </p>
                              <p className="text-muted-foreground">{getItemSummaryMediaLabel(item)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No active items</p>
                      )}
                    </Card>

                    <Card className="p-4">
                      <h3 className="font-semibold mb-2">Upcoming items</h3>
                      {upcomingItemSummaries.length ? (
                        <div className="space-y-2">
                          {upcomingItemSummaries.map((item) => (
                            <div key={item.item_id} className="rounded border p-3 text-sm space-y-1">
                              <p className="font-medium">{item.presentation_name || "Scheduled presentation"}</p>
                              {item.layout_name ? (
                                <p className="text-muted-foreground">Layout: {item.layout_name}</p>
                              ) : null}
                              <p className="text-muted-foreground">
                                {formatDateTime(item.start_at)} to {formatDateTime(item.end_at)}
                              </p>
                              <p className="text-muted-foreground">{getItemSummaryMediaLabel(item)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No upcoming items</p>
                      )}
                    </Card>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">No content currently playing</p>
              )}
            </TabsContent>

            <TabsContent value="snapshot">
              {snapshot ? (
                <Card className="p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label className="text-muted-foreground">Latest preview</Label>
                      <p className="text-sm">{formatDateTime(latestPreview?.captured_at)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerScreenshot.mutate()}
                      disabled={isTakingSnapshot}
                    >
                      <RefreshCcw className={`h-3 w-3 mr-1 ${isTakingSnapshot ? "animate-spin" : ""}`} />
                      {isTakingSnapshot ? "Capturing..." : "Take Snapshot"}
                    </Button>
                  </div>

                  {latestPreview?.screenshot_url ? (
                    <div className="space-y-2">
                      <img
                        src={latestPreview.screenshot_url}
                        alt="Latest captured screen preview"
                        className="w-full rounded-md border bg-black object-contain max-h-[360px]"
                      />
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Captured: {formatDateTime(latestPreview.captured_at)}</span>
                        <span>{latestPreview.stale ? "Preview is stale" : "Preview is fresh"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No captured preview available yet.
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Playback source</Label>
                      <p>{playback?.source || "UNKNOWN"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Published at</Label>
                      <p>{formatDateTime(snapshot.publish?.published_at)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Schedule</Label>
                      <p>{snapshot.snapshot?.schedule?.name || nowPlaying?.current_schedule?.name || "None"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Snapshot items</Label>
                      <p>{snapshot.snapshot?.schedule?.items?.length ?? 0}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Emergency</Label>
                      <p>{snapshot.emergency ? "Active" : "Not active"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Default media</Label>
                      <p>{snapshot.default_media ? "Configured" : "Not configured"}</p>
                    </div>
                  </div>

                  {playback?.current_media && (
                    <div>
                      <Label className="text-muted-foreground">Current Media</Label>
                      <p className="font-semibold">
                        {playback.current_media.name || playback.current_media.filename || "Unknown media"}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">{playback.current_media.id}</p>
                      {playback.current_media.media_url && (
                        <a
                          href={playback.current_media.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View Media
                        </a>
                      )}
                    </div>
                  )}
                </Card>
              ) : (
                <p className="text-center text-muted-foreground py-8">No snapshot data available</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
