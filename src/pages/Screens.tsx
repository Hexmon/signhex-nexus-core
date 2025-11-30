import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Monitor, Plus, MapPin, Power, Users, QrCode } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { screensApi } from "@/api/domains/screens";
import { devicePairingApi } from "@/api/domains/devicePairing";
import { deviceTelemetryApi } from "@/api/domains/deviceTelemetry";
import type { Screen, ScreenGroup, DevicePairing } from "@/api/types";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { queryKeys } from "@/api/queryKeys";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";

export default function Screens() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formState, setFormState] = useState({ name: "", location: "" });
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [pairingCode, setPairingCode] = useState("");
  const [commandDeviceId, setCommandDeviceId] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.screens,
    queryFn: () => screensApi.list({ limit: 100 }),
  });

  const screenGroupsQuery = useQuery({
    queryKey: queryKeys.screenGroups,
    queryFn: screensApi.listGroups,
  });

  const pairingsQuery = useQuery({
    queryKey: ["device-pairings"],
    queryFn: () => devicePairingApi.list({ page: 1, limit: 10 }),
  });

  const deviceCommandsQuery = useQuery({
    queryKey: ["device-commands", commandDeviceId],
    queryFn: () => deviceTelemetryApi.listCommands(commandDeviceId),
    enabled: Boolean(commandDeviceId),
  });

  const screens = useMemo(() => data?.items ?? [], [data]);

  const createScreen = useSafeMutation({
    mutationFn: (payload: { name: string; location?: string }) => screensApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.screens });
      setIsAddDialogOpen(false);
      setFormState({ name: "", location: "" });
    },
  }, "Unable to add screen.");

  const createGroup = useSafeMutation({
    mutationFn: (payload: { name: string; description?: string }) => screensApi.createGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.screenGroups });
      setGroupForm({ name: "", description: "" });
    },
  }, "Unable to create group.");

  const generatePairing = useSafeMutation({
    mutationFn: () => devicePairingApi.generate({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-pairings"] });
    },
  }, "Unable to generate pairing code.");

  const completePairing = useSafeMutation({
    mutationFn: (code: string) => devicePairingApi.complete({ pairing_code: code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-pairings"] });
      setPairingCode("");
    },
  }, "Unable to complete pairing.");

  const ackCommand = useSafeMutation({
    mutationFn: (commandId: string) => deviceTelemetryApi.ackCommand(commandDeviceId, commandId),
    onSuccess: () => {
      deviceCommandsQuery.refetch();
    },
  }, "Unable to acknowledge command.");

  const filteredScreens = useMemo(
    () =>
      screens.filter((screen) => {
        const q = search.toLowerCase();
        return (
          q === "" ||
          screen.name.toLowerCase().includes(q) ||
          (screen.location || "").toLowerCase().includes(q) ||
          screen.id.toLowerCase().includes(q)
        );
      }),
    [screens, search]
  );

  const stats = useMemo(() => {
    const total = screens.length;
    const online = screens.filter((s) => s.status === "ACTIVE").length;
    const offline = screens.filter((s) => s.status === "OFFLINE").length;
    const inactive = screens.filter((s) => s.status === "INACTIVE").length;
    return { total, online, offline, inactive };
  }, [screens]);

  const screenGroups: ScreenGroup[] = screenGroupsQuery.data ?? [];
  const pairings: DevicePairing[] = pairingsQuery.data?.items ?? [];

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
        <StatCard title="Total Screens" value={stats.total} icon={<Monitor className="h-5 w-5 text-primary" />} />
        <StatCard title="Active" value={stats.online} icon={<Power className="h-5 w-5 text-green-600" />} />
        <StatCard title="Offline" value={stats.offline} icon={<Power className="h-5 w-5 text-red-600" />} />
        <StatCard title="Inactive" value={stats.inactive} icon={<Power className="h-5 w-5 text-yellow-600" />} />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <SearchBar placeholder="Search screens by name, location, or ID..." onSearch={setSearch} initialValue={search} />
          </div>
          <div className="text-sm text-muted-foreground">
            {isFetching ? "Refreshing..." : `${filteredScreens.length} screens`}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingIndicator fullScreen label="Loading screens..." />
      ) : filteredScreens.length === 0 ? (
        <EmptyState title="No screens found" description="Try adjusting your search or add a new screen." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScreens.map((screen: Screen) => (
            <Card key={screen.id} className="p-5 hover:shadow-lg transition-shadow space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      screen.status === "ACTIVE"
                        ? "bg-green-500/10 text-green-600"
                        : screen.status === "OFFLINE"
                        ? "bg-red-500/10 text-red-600"
                        : "bg-yellow-500/10 text-yellow-600"
                    }`}
                  >
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{screen.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{screen.id}</p>
                  </div>
                </div>
                <StatusBadge status={(screen.status || "offline").toLowerCase()} />
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{screen.location || "Unassigned"}</span>
                </div>
                {screen.last_heartbeat_at && (
                  <div className="text-xs">
                    Last heartbeat: {new Date(screen.last_heartbeat_at).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Badge variant="outline">{screen.status || "UNKNOWN"}</Badge>
              </div>
            </Card>
          ))}
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
              onClick={() => createGroup.mutate({ name: groupForm.name.trim(), description: groupForm.description })}
              disabled={createGroup.isPending || !groupForm.name.trim()}
            >
              Add Group
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Group name"
                value={groupForm.name}
                onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Description"
                value={groupForm.description}
                onChange={(e) => setGroupForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="divide-y rounded-md border max-h-72 overflow-auto">
              {screenGroupsQuery.isLoading && (
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
              )}
              {!screenGroupsQuery.isLoading && screenGroups.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">No groups yet.</div>
              )}
              {screenGroups.map((group) => (
                <div key={group.id} className="px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.description || "—"}</p>
                  </div>
                  <Badge variant="outline">{group.id.slice(0, 6)}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Device Pairing</h2>
            </div>
            <Button
              size="sm"
              onClick={() => generatePairing.mutate()}
              disabled={generatePairing.isPending}
            >
              {generatePairing.isPending ? "Generating..." : "Generate Code"}
            </Button>
            </div>

          <div className="flex gap-2">
            <Input
              placeholder="Enter pairing code"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={() => completePairing.mutate(pairingCode.trim())}
              disabled={completePairing.isPending || !pairingCode.trim()}
            >
              {completePairing.isPending ? "Pairing..." : "Complete"}
            </Button>
            </div>

          <div className="divide-y rounded-md border max-h-72 overflow-auto">
            {pairingsQuery.isLoading && (
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            )}
            {!pairingsQuery.isLoading && pairings.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">No pairings yet.</div>
            )}
            {pairings.map((pair) => (
              <div key={pair.id} className="px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="font-medium">{pair.pairing_code ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {pair.status ?? "PENDING"} {pair.device_id ? `· ${pair.device_id}` : ""}
                  </p>
                </div>
                <Badge variant="secondary">{pair.id.slice(0, 6)}</Badge>
              </div>
              ))}
          </div>

          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Device Commands</h3>
              <Input
                placeholder="Device ID"
                className="max-w-xs"
                value={commandDeviceId}
                onChange={(e) => setCommandDeviceId(e.target.value)}
              />
            </div>
            <div className="divide-y rounded-md border max-h-48 overflow-auto">
              {deviceCommandsQuery.isFetching && (
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              )}
              {!deviceCommandsQuery.isFetching &&
                (deviceCommandsQuery.data?.length ?? 0) === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">No commands.</div>
                )}
              {(deviceCommandsQuery.data ?? []).map((cmd) => (
                <div key={cmd.id} className="px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{cmd.type}</p>
                    <p className="text-xs text-muted-foreground">{cmd.status ?? "pending"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => ackCommand.mutate(cmd.id)}
                    disabled={ackCommand.isPending}
                  >
                    Ack
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Screen</DialogTitle>
            <DialogDescription>Register a new display screen to the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="screen-name">Screen Name</Label>
              <Input
                id="screen-name"
                value={formState.name}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Lobby Display"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formState.location}
                onChange={(e) => setFormState((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Building A - Lobby"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={createScreen.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => createScreen.mutate({ name: formState.name.trim(), location: formState.location.trim() })}
              disabled={createScreen.isPending || !formState.name.trim()}
            >
              {createScreen.isPending ? "Saving..." : "Add Screen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
