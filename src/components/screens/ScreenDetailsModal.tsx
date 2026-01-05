import { useState } from "react";
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
import { screensApi } from "@/api/domains/screens";
import { queryKeys } from "@/api/queryKeys";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Clock, Edit2, MapPin, Monitor, Save, X } from "lucide-react";

interface ScreenDetailsModalProps {
    screenId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ScreenDetailsModal({ screenId, open, onOpenChange }: ScreenDetailsModalProps) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", location: "" });

    const { data: screen, isLoading } = useQuery({
        queryKey: ["screen", screenId],
        queryFn: () => screensApi.getById(screenId),
        enabled: open,
    });

    const { data: status } = useQuery({
        queryKey: ["screen-status", screenId],
        queryFn: () => screensApi.getStatus(screenId),
        enabled: open,
        refetchInterval: 30000,
    });

    const { data: nowPlaying } = useQuery({
        queryKey: ["screen-now-playing", screenId],
        queryFn: () => screensApi.getNowPlaying(screenId),
        enabled: open,
        refetchInterval: 10000,
    });

    const { data: availability } = useQuery({
        queryKey: ["screen-availability", screenId],
        queryFn: () => screensApi.getAvailability(screenId),
        enabled: open,
    });

    const { data: snapshot } = useQuery({
        queryKey: ["screen-snapshot", screenId],
        queryFn: () => screensApi.getSnapshot(screenId, true),
        enabled: open,
    });

    const updateScreen = useSafeMutation({
        mutationFn: (payload: { name: string; location?: string }) =>
            screensApi.update(screenId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["screen", screenId] });
            queryClient.invalidateQueries({ queryKey: queryKeys.screens });
            setIsEditing(false);
            toast.success("Screen updated successfully");
        },
    }, "Unable to update screen.");

    const handleEdit = () => {
        if (screen) {
            setEditForm({
                name: screen.name,
                location: screen.location || ""
            });
            setIsEditing(true);
        }
    };

    const handleSave = () => {
        updateScreen.mutate({
            name: editForm.name.trim(),
            location: editForm.location.trim() || undefined,
        });
    };

    if (isLoading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl">
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

    if (!screen) return null;

    const { name, location, id, created_at, updated_at } = screen;
    const screenStatus = status?.status || screen.status || "UNKNOWN";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2">
                                {isEditing ? (
                                    <Input
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="text-lg font-semibold"
                                    />
                                ) : (
                                    <>
                                        <Monitor className="h-5 w-5" />
                                        {name}
                                    </>
                                )}
                            </DialogTitle>
                            <DialogDescription className="font-mono">{id}</DialogDescription>
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
                                <Button size="sm" variant="outline" onClick={handleEdit}>
                                    <Edit2 className="h-3 w-3 mr-1" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="overview" className="mt-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="status">Status</TabsTrigger>
                        <TabsTrigger value="playing">Now Playing</TabsTrigger>
                        <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <Card className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Location</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.location}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                            placeholder="Enter location"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            <span>{location || "Not set"}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div>
                                        <Badge
                                            variant={
                                                screenStatus === "ACTIVE" ? "default" :
                                                    screenStatus === "OFFLINE" ? "destructive" :
                                                        "secondary"
                                            }
                                        >
                                            {screenStatus}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Created</Label>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4" />
                                        {created_at ? new Date(created_at).toLocaleString() : "N/A"}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Last Updated</Label>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4" />
                                        {updated_at ? new Date(updated_at).toLocaleString() : "N/A"}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {availability && (
                            <Card className="p-4">
                                <h3 className="font-semibold mb-2">Availability</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        <span>
                                            {availability.is_available ? "Available" : "Not Available"}
                                        </span>
                                    </div>
                                    {availability.current_schedule_id && (
                                        <p className="text-sm text-muted-foreground">
                                            Current Schedule: {availability.current_schedule_id}
                                        </p>
                                    )}
                                    {availability.next_available_at && (
                                        <p className="text-sm text-muted-foreground">
                                            Next Available: {new Date(availability.next_available_at).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="status">
                        {status ? (
                            <Card className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <p className="text-lg font-semibold">{status.status}</p>
                                    </div>
                                    {status.uptime_seconds !== undefined && (
                                        <div>
                                            <Label className="text-muted-foreground">Uptime</Label>
                                            <p className="text-lg font-semibold">
                                                {Math.floor(status.uptime_seconds / 3600)}h {Math.floor((status.uptime_seconds % 3600) / 60)}m
                                            </p>
                                        </div>
                                    )}
                                    {status.last_heartbeat_at && (
                                        <div className="col-span-2">
                                            <Label className="text-muted-foreground">Last Heartbeat</Label>
                                            <p className="text-sm">{new Date(status.last_heartbeat_at).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No status data available</p>
                        )}
                    </TabsContent>

                    <TabsContent value="playing">
                        {nowPlaying ? (
                            <Card className="p-4 space-y-3">
                                <div className="space-y-2">
                                    <div>
                                        <Label className="text-muted-foreground">Media</Label>
                                        <p className="text-lg font-semibold">{nowPlaying.media_name || "No media playing"}</p>
                                        {nowPlaying.media_id && (
                                            <p className="text-xs text-muted-foreground font-mono">{nowPlaying.media_id}</p>
                                        )}
                                    </div>
                                    {nowPlaying.started_at && (
                                        <div>
                                            <Label className="text-muted-foreground">Started At</Label>
                                            <p className="text-sm">{new Date(nowPlaying.started_at).toLocaleString()}</p>
                                        </div>
                                    )}
                                    {nowPlaying.schedule_id && (
                                        <div>
                                            <Label className="text-muted-foreground">Schedule ID</Label>
                                            <p className="text-sm font-mono">{nowPlaying.schedule_id}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No content currently playing</p>
                        )}
                    </TabsContent>

                    <TabsContent value="snapshot">
                        {snapshot ? (
                            <Card className="p-4 space-y-4">
                                <div>
                                    <Label className="text-muted-foreground">Snapshot Time</Label>
                                    <p className="text-sm">{new Date(snapshot.snapshot_at).toLocaleString()}</p>
                                </div>
                                {snapshot.current_media && (
                                    <div>
                                        <Label className="text-muted-foreground">Current Media</Label>
                                        <p className="font-semibold">{snapshot.current_media.name}</p>
                                        <p className="text-xs font-mono text-muted-foreground">{snapshot.current_media.id}</p>
                                        {snapshot.current_media.url && (
                                            <a
                                                href={snapshot.current_media.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline"
                                            >
                                                View Media
                                            </a>
                                        )}
                                    </div>
                                )}
                                {snapshot.schedule && (
                                    <div>
                                        <Label className="text-muted-foreground">Schedule</Label>
                                        <p className="font-semibold">{snapshot.schedule.name}</p>
                                        <p className="text-xs font-mono text-muted-foreground">{snapshot.schedule.id}</p>
                                    </div>
                                )}
                            </Card>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No snapshot data available</p>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}