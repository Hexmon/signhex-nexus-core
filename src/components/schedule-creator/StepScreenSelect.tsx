import { useMemo, useState } from "react";
import { Monitor, Users, Check, Circle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { screensApi } from "@/api/domains/screens";
import { queryKeys } from "@/api/queryKeys";
import { SearchBar } from "@/components/common/SearchBar";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { EmptyState } from "@/components/common/EmptyState";
import { useToast } from "@/hooks/use-toast";
import type { ScreenSnapshot } from "@/api/types";

interface StepScreenSelectProps {
  selectedScreenIds: string[];
  selectedGroupIds: string[];
  onUpdateSelection: (screenIds: string[], groupIds: string[]) => void;
}

const SCREEN_PAGE_SIZE = 100;

type TimelineState = {
  entityId: string | null;
  entityType: "screen" | "group";
  snapshot: ScreenSnapshot | null;
  isLoading: boolean;
  error?: string;
};

type AvailabilityStatus = "busy" | "available" | "unknown";

export function StepScreenSelect({
  selectedScreenIds,
  selectedGroupIds,
  onUpdateSelection,
}: StepScreenSelectProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("screens");
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, AvailabilityStatus>>({});
  const [timelineState, setTimelineState] = useState<TimelineState>({
    entityId: null,
    entityType: "screen",
    snapshot: null,
    isLoading: false,
  });
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [checkingAvailabilityFor, setCheckingAvailabilityFor] = useState<string | null>(null);

  const { data: screensData, isLoading: isScreensLoading } = useQuery({
    queryKey: queryKeys.screens,
    queryFn: () => screensApi.list({ page: 1, limit: SCREEN_PAGE_SIZE }),
  });

  const { data: screenGroupsData, isLoading: isGroupsLoading } = useQuery({
    queryKey: queryKeys.screenGroups,
    queryFn: () => screensApi.listGroups({ page: 1, limit: SCREEN_PAGE_SIZE }),
  });

  const screens = useMemo(() => screensData?.items ?? [], [screensData]);
  const screenGroups = useMemo(() => screenGroupsData?.items ?? [], [screenGroupsData]);
  const screensById = useMemo(() => new Map(screens.map((screen) => [screen.id, screen])), [screens]);

  const filteredScreens = useMemo(() => {
    if (!searchQuery) return screens;
    const q = searchQuery.toLowerCase();
    return screens.filter((s) => {
      const name = s.name?.toLowerCase() ?? "";
      const location = s.location?.toLowerCase() ?? "";
      const id = s.id?.toLowerCase() ?? "";
      return name.includes(q) || location.includes(q) || id.includes(q);
    });
  }, [searchQuery, screens]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return screenGroups;
    const q = searchQuery.toLowerCase();
    return screenGroups.filter((g) => {
      const name = g.name?.toLowerCase() ?? "";
      const description = g.description?.toLowerCase() ?? "";
      const id = g.id?.toLowerCase() ?? "";
      return name.includes(q) || description.includes(q) || id.includes(q);
    });
  }, [searchQuery, screenGroups]);

  const toggleScreen = (screenId: string) => {
    const newIds = selectedScreenIds.includes(screenId)
      ? selectedScreenIds.filter((id) => id !== screenId)
      : [...selectedScreenIds, screenId];
    onUpdateSelection(newIds, selectedGroupIds);
  };

  const toggleGroup = (groupId: string) => {
    const newIds = selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter((id) => id !== groupId)
      : [...selectedGroupIds, groupId];
    onUpdateSelection(selectedScreenIds, newIds);
  };

  const availabilityKey = (type: "screen" | "group", id: string) => `${type}:${id}`;

  const fetchTimelineSnapshot = (type: "screen" | "group", id: string) => {
    if (type === "group") {
      return screensApi.getGroupSnapshot(id, true);
    }
    return screensApi.getSnapshot(id, true);
  };

  const determineAvailability = (snapshot: ScreenSnapshot): AvailabilityStatus => {
    if (snapshot.emergency) return "busy";
    const items = snapshot.snapshot?.schedule?.items ?? [];
    if (!items.length) return "unknown";
    const now = Date.now();
    const busy = items.some((item) => {
      const start = item.start_at ? Date.parse(item.start_at) : NaN;
      const end = item.end_at ? Date.parse(item.end_at) : NaN;
      if (Number.isNaN(start) || Number.isNaN(end)) return false;
      return start <= now && now <= end;
    });
    return busy ? "busy" : "available";
  };

  const handleCheckAvailability = async (type: "screen" | "group", id: string) => {
    const key = availabilityKey(type, id);
    setCheckingAvailabilityFor(key);
    try {
      const snapshot = await fetchTimelineSnapshot(type, id);
      const status = determineAvailability(snapshot);
      setAvailabilityMap((prev) => ({ ...prev, [key]: status }));
      toast({
        title:
          status === "busy"
            ? "Currently busy"
            : status === "available"
            ? "Currently available"
            : "Status unknown",
        description:
          status === "busy"
            ? "This target has an active schedule right now."
            : status === "available"
            ? "This target appears available right now."
            : "Unable to determine availability from the snapshot.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to fetch schedule snapshot.";
      toast({ title: "Availability check failed", description: message, variant: "destructive" });
    } finally {
      setCheckingAvailabilityFor(null);
    }
  };

  const handleViewTimeline = async (type: "screen" | "group", id: string) => {
    setTimelineState({ entityId: id, entityType: type, snapshot: null, isLoading: true });
    setIsTimelineOpen(true);
    try {
      const snapshot = await fetchTimelineSnapshot(type, id);
      setTimelineState({ entityId: id, entityType: type, snapshot, isLoading: false });
    } catch (error) {
      setTimelineState({
        entityId: id,
        entityType: type,
        snapshot: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unable to load schedule snapshot.",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-500";
      case "OFFLINE":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default" as const;
      case "OFFLINE":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const totalSelected = selectedScreenIds.length + selectedGroupIds.length;
  const isLoading = isScreensLoading || isGroupsLoading;

  const timelineItems = useMemo(
    () => timelineState.snapshot?.snapshot?.schedule?.items ?? [],
    [timelineState.snapshot],
  );
  const timelineRange = useMemo(() => {
    if (!timelineItems.length) return null;
    const starts = timelineItems
      .map((item) => (item.start_at ? Date.parse(item.start_at) : NaN))
      .filter((value) => !Number.isNaN(value));
    const ends = timelineItems
      .map((item) => (item.end_at ? Date.parse(item.end_at) : NaN))
      .filter((value) => !Number.isNaN(value));
    if (!starts.length || !ends.length) return null;
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    return { start: min, end: max, total: Math.max(max - min, 1) };
  }, [timelineItems]);

  const timelinePriorities = useMemo(
    () =>
      Array.from(new Set(timelineItems.map((item) => item.priority ?? 0)))
        .sort((a, b) => b - a),
    [timelineItems],
  );

  const formatTimelineTime = (value?: string) =>
    value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  const getAvailabilityBadgeVariant = (status: AvailabilityStatus) => {
    switch (status) {
      case "busy":
        return "destructive";
      case "available":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Select Target Screens</h2>
        <p className="text-sm text-muted-foreground">
          Choose individual screens or screen groups to display your content
        </p>
      </div>

      {/* Selection summary */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <p className="font-medium">
            {totalSelected === 0 ? (
              "No screens selected"
            ) : (
              <>
                {selectedScreenIds.length > 0 && (
                  <span>{selectedScreenIds.length} screen(s)</span>
                )}
                {selectedScreenIds.length > 0 && selectedGroupIds.length > 0 && (
                  <span> + </span>
                )}
                {selectedGroupIds.length > 0 && (
                  <span>{selectedGroupIds.length} group(s)</span>
                )}
                {" selected"}
              </>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedScreenIds.length > 0 &&
              `Screens: ${selectedScreenIds
                .map((id) => screensById.get(id)?.name)
                .filter(Boolean)
                .join(", ")}`}
          </p>
        </div>
        {totalSelected > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {totalSelected}
          </Badge>
        )}
      </div>

      {/* Search */}
      <SearchBar
        placeholder="Search screens or groups..."
        onSearch={setSearchQuery}
        initialValue={searchQuery}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="screens" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Individual Screens
            <Badge variant="secondary" className="ml-1">
              {screens.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Screen Groups
            <Badge variant="secondary" className="ml-1">
              {screenGroups.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="screens" className="mt-4">
          {isLoading ? (
            <div className="py-6">
              <LoadingIndicator label="Loading screens..." />
            </div>
          ) : filteredScreens.length === 0 ? (
            <EmptyState
              title="No screens found"
              description="Try adjusting your search or check your filters."
            />
          ) : (
            <ScrollArea className="h-[350px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
                {filteredScreens.map((screen) => {
                  const isSelected = selectedScreenIds.includes(screen.id);
                  const status = screen.status ?? "INACTIVE";
                  const availabilityStatus =
                    availabilityMap[availabilityKey("screen", screen.id)] ?? "unknown";
                  return (
                    <Card
                      key={screen.id}
                      onClick={() => toggleScreen(screen.id)}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? "ring-2 ring-primary border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleScreen(screen.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Circle
                              className={`h-2 w-2 fill-current ${getStatusColor(status)}`}
                            />
                            <h4 className="font-medium truncate">{screen.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {screen.location || "No location"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={getStatusBadgeVariant(status)}>
                              {status}
                            </Badge>
                            {screen.last_heartbeat_at && (
                              <span className="text-xs text-muted-foreground">
                                Last seen: {new Date(screen.last_heartbeat_at).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getAvailabilityBadgeVariant(availabilityStatus)}>
                            {availabilityStatus === "busy"
                              ? "Status: Busy"
                              : availabilityStatus === "available"
                              ? "Status: Available"
                              : "Status: Unknown"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCheckAvailability("screen", screen.id);
                            }}
                            disabled={checkingAvailabilityFor === availabilityKey("screen", screen.id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {checkingAvailabilityFor === availabilityKey("screen", screen.id)
                              ? "Checking..."
                              : "Check availability"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleViewTimeline("screen", screen.id);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View schedule timeline
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          {isLoading ? (
            <div className="py-6">
              <LoadingIndicator label="Loading screen groups..." />
            </div>
          ) : filteredGroups.length === 0 ? (
            <EmptyState
              title="No screen groups found"
              description="Try adjusting your search or create a new group."
            />
          ) : (
            <ScrollArea className="h-[350px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
                {filteredGroups.map((group) => {
                  const isSelected = selectedGroupIds.includes(group.id);
                  const groupScreenIds = group.screen_ids ?? [];
                  const screenCount = groupScreenIds.length;
                  const activeCount = groupScreenIds.filter(
                    (id) => screensById.get(id)?.status === "ACTIVE",
                  ).length;
                  const availabilityStatus =
                    availabilityMap[availabilityKey("group", group.id)] ?? "unknown";
                  return (
                    <Card
                      key={group.id}
                      onClick={() => toggleGroup(group.id)}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? "ring-2 ring-primary border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleGroup(group.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <h4 className="font-medium truncate">{group.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {group.description || "No description"}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1 text-xs">
                              <Monitor className="h-3 w-3" />
                              <span>{screenCount} screens</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Circle className="h-2 w-2 fill-current" />
                              <span>{activeCount} active</span>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getAvailabilityBadgeVariant(availabilityStatus)}>
                            {availabilityStatus === "busy"
                              ? "Status: Busy"
                              : availabilityStatus === "available"
                              ? "Status: Available"
                              : "Status: Unknown"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCheckAvailability("group", group.id);
                            }}
                            disabled={checkingAvailabilityFor === availabilityKey("group", group.id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {checkingAvailabilityFor === availabilityKey("group", group.id)
                              ? "Checking..."
                              : "Check availability"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleViewTimeline("group", group.id);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View schedule timeline
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={isTimelineOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsTimelineOpen(false);
            setTimelineState({ entityId: null, entityType: "screen", snapshot: null, isLoading: false });
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Timeline for {timelineState.entityType} {timelineState.entityId || "selection"}
            </DialogTitle>
            <DialogDescription>
              Visual timeline shows scheduled items fetched from the most recent snapshot.
            </DialogDescription>
          </DialogHeader>
          {timelineState.isLoading ? (
            <div className="py-6">
              <LoadingIndicator label="Loading timeline..." />
            </div>
          ) : timelineState.error ? (
            <p className="text-sm text-destructive">{timelineState.error}</p>
          ) : timelineRange && timelineItems.length && timelinePriorities.length ? (
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="flex flex-col items-center text-[10px] text-muted-foreground">
                  <span className="font-semibold rotate-[-90deg]">priority</span>
                  <span className="mt-2 h-10 w-1 rounded bg-muted" />
                  <span className="mt-2 text-xs">↑</span>
                </div>
                <div className="relative flex-1 rounded-[32px] border border-border bg-white/70 p-4 shadow-sm">
                  <div className="absolute inset-y-2 left-10 w-px bg-border/20" />
                  <div className="absolute inset-x-0 top-12 grid h-[calc(100%-4rem)] grid-cols-4">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="border-r border-dashed border-muted/40 last:border-0"
                      />
                    ))}
                  </div>
                  <div className="space-y-3">
                    {timelinePriorities.map((priority) => {
                      const itemsForPriority = timelineItems.filter(
                        (item) => (item.priority ?? 0) === priority,
                      );
                      if (!itemsForPriority.length) return null;
                      return (
                        <div key={`priority-${priority}`} className="space-y-1 text-[10px]">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="font-semibold">Priority {priority}</span>
                            <span>
                              {formatTimelineTime(itemsForPriority[0].start_at)} –{" "}
                              {formatTimelineTime(itemsForPriority[itemsForPriority.length - 1].end_at)}
                            </span>
                          </div>
                          <div className="relative h-6 rounded-full border border-muted/40 bg-muted/30">
                            {itemsForPriority.map((item) => {
                              const start = item.start_at ? Date.parse(item.start_at) : NaN;
                              const end = item.end_at ? Date.parse(item.end_at) : NaN;
                              if (Number.isNaN(start) || Number.isNaN(end)) return null;
                              const left = ((start - timelineRange.start) / timelineRange.total) * 100;
                              const width = ((end - start) / timelineRange.total) * 100;
                              return (
                                <div
                                  key={`${item.id}-${priority}`}
                                  className="absolute top-[12.5%] h-[75%] rounded-full border border-primary/70 bg-primary/60 px-2 text-[10px] text-primary-foreground flex items-center overflow-hidden"
                                  style={{
                                    left: `${Math.max(0, left)}%`,
                                    width: `${Math.min(100, width)}%`,
                                  }}
                                >
                                  <span className="truncate">
                                    {item.presentation_id ?? item.id}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute inset-x-0 bottom-[-18px] flex items-center justify-between text-[10px] text-muted-foreground px-4">
                    <span>{formatTimelineTime(new Date(timelineRange.start).toISOString())}</span>
                    <span className="flex items-center gap-1">timeline →</span>
                    <span>{formatTimelineTime(new Date(timelineRange.end).toISOString())}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No timeline data is available for this target right now.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimelineOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
