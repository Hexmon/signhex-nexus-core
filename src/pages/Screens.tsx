import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Monitor, Plus, MapPin, Power, Users, QrCode, Eye, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { screensApi } from "@/api/domains/screens";
import { devicePairingApi } from "@/api/domains/devicePairing";
import type { Screen, ScreenGroup, DevicePairing } from "@/api/types";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { queryKeys } from "@/api/queryKeys";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { PairDeviceModal } from "@/components/screens/PairDeviceModal";
import { ScreenDetailsModal } from "@/components/screens/ScreenDetailsModal";
import { toast } from "sonner";
import { CreateGroupModal } from "@/components/screens/CreateGroupModal";
import { UpdateGroupModal } from "@/components/screens/UpdateGroupModal";

export default function Screens() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ name: "", location: "" });

  const { data: screensData, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.screens,
    queryFn: () => screensApi.list({ page: 1, limit: 100 }),
  });

  const { data: screenGroupsData } = useQuery({
    queryKey: queryKeys.screenGroups,
    queryFn: () => screensApi.listGroups({ page: 1, limit: 100 }),
  });

  const { data: pairingsData } = useQuery({
    queryKey: ["device-pairings"],
    queryFn: () => devicePairingApi.list({ page: 1, limit: 10 }),
  });

  const screens = useMemo(() => screensData?.items ?? [], [screensData]);
  const screenGroups = useMemo(() => screenGroupsData?.items ?? [], [screenGroupsData]);
  const pairings = useMemo(() => pairingsData?.items ?? [], [pairingsData]);

  const createScreen = useSafeMutation({
    mutationFn: (payload: { name: string; location?: string }) => screensApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.screens });
      setIsAddDialogOpen(false);
      setFormState({ name: "", location: "" });
      toast.success("Screen created successfully");
    },
  }, "Unable to create screen.");

  const deleteScreen = useSafeMutation({
    mutationFn: (id: string) => screensApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.screens });
      toast.success("Screen deleted successfully");
    },
  }, "Unable to delete screen.");

  const deleteGroup = useSafeMutation({
    mutationFn: (id: string) => screensApi.removeGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.screenGroups });
      queryClient.invalidateQueries({ queryKey: ["available-screens"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.screens });
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
    [screens, search]
  );

  const stats = useMemo(() => {
    const total = screens.length;
    const active = screens.filter((s) => s.status === "ACTIVE").length;
    const offline = screens.filter((s) => s.status === "OFFLINE").length;
    const inactive = screens.filter((s) => s.status === "INACTIVE").length;
    return { total, active, offline, inactive };
  }, [screens]);

  const handleDeleteScreen = (screenId: string) => {
    deleteScreen.mutate(screenId);
  };

  const handleDeleteGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteGroup.mutate(groupId);
    toast.success("Group deleted successfully");
  };

  const handleEditGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGroupId(groupId);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Screens"
        description="Manage and monitor all display screens across locations"
        actionLabel="Add Screen"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={() => setIsAddDialogOpen(true)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Screens"
          value={stats.total}
          icon={<Monitor className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={<Power className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          title="Offline"
          value={stats.offline}
          icon={<Power className="h-5 w-5 text-red-600" />}
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          icon={<Power className="h-5 w-5 text-yellow-600" />}
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
            {isFetching ? "Refreshing..." : `${filteredScreens.length} screens`}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingIndicator fullScreen label="Loading screens..." />
      ) : filteredScreens.length === 0 ? (
        <EmptyState
          title="No screens found"
          description="Try adjusting your search or add a new screen."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScreens.map((screen) => {
            const { id, name, location, status, last_heartbeat_at } = screen;

            return (
              <Card key={id} className="p-5 hover:shadow-lg transition-shadow space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${status === "ACTIVE"
                        ? "bg-green-500/10 text-green-600"
                        : status === "OFFLINE"
                          ? "bg-red-500/10 text-red-600"
                          : "bg-yellow-500/10 text-yellow-600"
                        }`}
                    >
                      <Monitor className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{id}</p>
                    </div>
                  </div>
                  <StatusBadge status={(status || "offline").toLowerCase()} />
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{location || "Unassigned"}</span>
                  </div>
                  {last_heartbeat_at && (
                    <div className="text-xs">
                      Last heartbeat: {new Date(last_heartbeat_at).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Badge variant="outline">{status || "UNKNOWN"}</Badge>
                </div>

                <div className="flex gap-2 pt-2">
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
            {screenGroupsData?.items.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No groups yet. Create one to organize your screens.
              </div>
            ) : (
              <>
                {screenGroups.map((group) => {
                  const { id, name, description, screen_ids } = group;

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
                        <p className="text-xs text-muted-foreground mt-1">
                          {screen_ids?.length || 0} screens
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleEditGroup(id, e)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleDeleteGroup(id, e)}
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
            <Button
              size="sm"
              onClick={() => setIsPairModalOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Pair Device
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            View all device pairing records (pending, used, expired)
          </p>

          <div className="divide-y rounded-md border max-h-72 overflow-auto">
            {pairings.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No pairings yet. Generate a code to pair a new device.
              </div>
            ) : (
              <>
                {pairings.map((pair) => {
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
                      {device_id && (
                        <p className="text-xs text-muted-foreground">
                          Device: <span className="font-mono">{device_id}</span>
                        </p>
                      )}
                      <div className="text-[10px] text-muted-foreground space-y-0.5">
                        {created_at && (
                          <p>Created: {new Date(created_at).toLocaleString()}</p>
                        )}
                        {used_at && (
                          <p>Used: {new Date(used_at).toLocaleString()}</p>
                        )}
                        {expires_at && status !== "used" && (
                          <p>Expires: {new Date(expires_at).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Screen</DialogTitle>
            <DialogDescription>
              Manually register a new display screen to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="screen-name">Screen Name *</Label>
              <Input
                id="screen-name"
                value={formState.name}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Lobby Display"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={formState.location}
                onChange={(e) => setFormState((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Building A - Lobby"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={createScreen.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createScreen.mutate({
                name: formState.name.trim(),
                location: formState.location.trim() || undefined
              })}
              disabled={createScreen.isPending || !formState.name.trim()}
            >
              {createScreen.isPending ? "Creating..." : "Add Screen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PairDeviceModal
        open={isPairModalOpen}
        onOpenChange={setIsPairModalOpen}
      />

      <CreateGroupModal
        open={isGroupModalOpen}
        onOpenChange={setIsGroupModalOpen}
      />

      {selectedGroupId && (
        <UpdateGroupModal
          groupId={selectedGroupId}
          open={!!selectedGroupId}
          onOpenChange={(open) => !open && setSelectedGroupId(null)}
        />
      )}

      {selectedScreenId && (
        <ScreenDetailsModal
          screenId={selectedScreenId}
          open={!!selectedScreenId}
          onOpenChange={(open) => !open && setSelectedScreenId(null)}
        />
      )}
    </div>
  );
}