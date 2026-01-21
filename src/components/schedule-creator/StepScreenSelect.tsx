import { useState, useMemo } from "react";
import { Monitor, Users, Check, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { screensApi } from "@/api/domains/screens";
import { queryKeys } from "@/api/queryKeys";
import { SearchBar } from "@/components/common/SearchBar";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { EmptyState } from "@/components/common/EmptyState";

interface StepScreenSelectProps {
  selectedScreenIds: string[];
  selectedGroupIds: string[];
  onUpdateSelection: (screenIds: string[], groupIds: string[]) => void;
}

const SCREEN_PAGE_SIZE = 100;

export function StepScreenSelect({
  selectedScreenIds,
  selectedGroupIds,
  onUpdateSelection,
}: StepScreenSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("screens");

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
                                Last seen:{" "}
                                {new Date(screen.last_heartbeat_at).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
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
                    (id) => screensById.get(id)?.status === "ACTIVE"
                  ).length;
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
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
