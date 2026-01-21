import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Trash2,
    GripVertical,
    Volume2,
    VolumeX,
    Image as ImageIcon,
    Video,
    FileText,
    Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "@/components/common/SearchBar";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { mediaApi } from "@/api/domains/media";
import type { MediaAsset, MediaType } from "@/api/types";
import { ApiError } from "@/api/apiClient";
import type { Layout } from "@/pages/Layouts";
import type { SlotMedia } from "@/pages/ScheduleCreator";

interface StepMediaAssignProps {
    layout: Layout;
    slotMedia: SlotMedia[];
    onUpdateSlotMedia: (slotMedia: SlotMedia[]) => void;
}

const MEDIA_PAGE_SIZE = 100;

export function StepMediaAssign({ layout, slotMedia, onUpdateSlotMedia }: StepMediaAssignProps) {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(
        layout.spec.slots[0]?.id || null
    );
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [mediaSearch, setMediaSearch] = useState("");
    const [mediaTypeFilter, setMediaTypeFilter] = useState("all");

    const slots = layout.spec.slots;

    const typeFilter = (mediaTypeFilter === "all"
        ? undefined
        : mediaTypeFilter.toUpperCase()) as MediaType | undefined;

    const { data, isLoading, isFetching, isError, error } = useQuery({
        queryKey: ["media", typeFilter],
        queryFn: () =>
            mediaApi.list({
                limit: MEDIA_PAGE_SIZE,
                page: 1,
                status: "READY",
                type: typeFilter,
            }),
        keepPreviousData: true,
    });

    useEffect(() => {
        if (!isError) return;
        const message = error instanceof ApiError ? error.message : "Unable to load media.";
        toast({ title: "Load failed", description: message, variant: "destructive" });
    }, [isError, error, toast]);

    const mediaItems = useMemo(() => data?.items ?? [], [data]);

    const filteredMedia = useMemo(() => {
        const query = mediaSearch.trim().toLowerCase();
        if (!query) return mediaItems;
        return mediaItems.filter((item) => {
            const name = (item.filename || item.name || "").toLowerCase();
            return name.includes(query);
        });
    }, [mediaItems, mediaSearch]);

    const getSlotMedia = (slotId: string) => {
        return slotMedia
            .filter((sm) => sm.slotId === slotId)
            .sort((a, b) => a.order - b.order);
    };

    const resolveMediaType = (media: MediaAsset): SlotMedia["mediaType"] => {
        if (media.type) {
            const type = media.type.toUpperCase();
            if (type === "IMAGE" || type === "VIDEO" || type === "DOCUMENT") {
                return type;
            }
        }
        const contentType = media.content_type || "";
        if (contentType.startsWith("image/")) return "IMAGE";
        if (contentType.startsWith("video/")) return "VIDEO";
        return "DOCUMENT";
    };

    const resolveMediaName = (media: MediaAsset) => media.filename || media.name || "Untitled media";

    const handleAddMedia = (media: MediaAsset) => {
        if (!selectedSlotId) return;

        const existingSlotMedia = getSlotMedia(selectedSlotId);
        const newOrder = existingSlotMedia.length;
        const mediaType = resolveMediaType(media);

        // Check audio - only one slot can have audio
        const hasAudioElsewhere = slotMedia.some(
            (sm) => sm.slotId !== selectedSlotId && sm.audioEnabled
        );

        const newSlotMedia: SlotMedia = {
            slotId: selectedSlotId,
            mediaId: media.id,
            mediaName: resolveMediaName(media),
            mediaType,
            mediaThumbnail: mediaType === "IMAGE" ? media.media_url : undefined,
            order: newOrder,
            durationSeconds: media.duration_seconds || 10,
            fitMode: "cover",
            audioEnabled: !hasAudioElsewhere && mediaType === "VIDEO",
        };

        onUpdateSlotMedia([...slotMedia, newSlotMedia]);
        setIsMediaPickerOpen(false);
        toast({ title: "Media added", description: `Added ${resolveMediaName(media)} to ${selectedSlotId}` });
    };

    const handleRemoveMedia = (slotId: string, mediaId: string) => {
        onUpdateSlotMedia(
            slotMedia.filter((sm) => !(sm.slotId === slotId && sm.mediaId === mediaId))
        );
    };

    const handleUpdateMediaSettings = (
        slotId: string,
        mediaId: string,
        updates: Partial<SlotMedia>
    ) => {
        onUpdateSlotMedia(
            slotMedia.map((sm) => {
                if (sm.slotId === slotId && sm.mediaId === mediaId) {
                    return { ...sm, ...updates };
                }
                // If enabling audio on this one, disable on others
                if (updates.audioEnabled && sm.slotId !== slotId) {
                    return { ...sm, audioEnabled: false };
                }
                return sm;
            })
        );
    };

    const getMediaIcon = (type: string) => {
        switch (type) {
            case "IMAGE":
                return <ImageIcon className="h-4 w-4" />;
            case "VIDEO":
                return <Video className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const renderMediaPreview = (media: MediaAsset, mediaType: SlotMedia["mediaType"]) => {
        if (!media.media_url) {
            return (
                <div className="h-24 w-full rounded bg-muted flex items-center justify-center text-muted-foreground">
                    {getMediaIcon(mediaType)}
                </div>
            );
        }

        if (mediaType === "IMAGE") {
            return (
                <div className="h-24 w-full rounded overflow-hidden bg-muted">
                    <img
                        src={media.media_url}
                        alt={resolveMediaName(media)}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                </div>
            );
        }

        if (mediaType === "VIDEO") {
            return (
                <div className="h-24 w-full rounded overflow-hidden bg-muted">
                    <video
                        src={media.media_url}
                        className="h-full w-full object-cover pointer-events-none"
                        muted
                        preload="metadata"
                    />
                </div>
            );
        }

        return (
            <div className="h-24 w-full rounded bg-muted flex items-center justify-center text-muted-foreground">
                <FileText className="h-6 w-6" />
            </div>
        );
    };

    const handleUploadNavigate = () => {
        setIsMediaPickerOpen(false);
        navigate("/media", {
            state: {
                returnTo: "/schedule/new",
                returnStep: 2,
                restoreDraft: true,
                openUpload: true,
            },
        });
    };

    const renderLayoutPreview = () => {
        const aspectRatio = layout.aspect_ratio === "9:16" ? 9 / 16 : 16 / 9;
        const previewWidth = 300;
        const previewHeight = previewWidth / aspectRatio;

        return (
            <div
                className="relative border-2 rounded-lg bg-muted/30 mx-auto"
                style={{ width: previewWidth, height: previewHeight }}
            >
                {slots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const slotMediaItems = getSlotMedia(slot.id);
                    const hasMedia = slotMediaItems.length > 0;
                    const primaryMedia = slotMediaItems[0];

                    return (
                        <div
                            key={slot.id}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`absolute border-2 transition-all cursor-pointer overflow-hidden ${isSelected
                                    ? "border-primary bg-primary/20"
                                    : hasMedia
                                        ? "border-primary/50 bg-primary/10"
                                        : "border-dashed border-muted-foreground/50 bg-muted/50"
                                }`}
                            style={{
                                left: `${slot.x * 100}%`,
                                top: `${slot.y * 100}%`,
                                width: `${slot.w * 100}%`,
                                height: `${slot.h * 100}%`,
                            }}
                        >
                            {hasMedia ? (
                                <div className="absolute inset-0 pointer-events-none">
                                    {primaryMedia.mediaType === "IMAGE" && primaryMedia.mediaThumbnail ? (
                                        <img
                                            src={primaryMedia.mediaThumbnail}
                                            alt={primaryMedia.mediaName}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex flex-col items-center justify-center gap-1 bg-muted/60 text-muted-foreground px-2 text-center">
                                            {getMediaIcon(primaryMedia.mediaType)}
                                            <span className="text-[10px] font-medium truncate w-full">
                                                {primaryMedia.mediaName}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-muted-foreground pointer-events-none">
                                    {slot.id}
                                </div>
                            )}

                            <div className="absolute top-1 left-1 flex items-center gap-1 pointer-events-none">
                                <Badge variant="secondary" className="text-[10px]">
                                    {slot.id}
                                </Badge>
                                {hasMedia && (
                                    <Badge variant="secondary" className="text-[10px]">
                                        {slotMediaItems.length}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Assign Media to Slots</h2>
                <p className="text-sm text-muted-foreground">
                    Click a slot in the preview, then add media items. Drag to reorder.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Layout Preview */}
                <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground">Layout Preview</h3>
                    {renderLayoutPreview()}
                    <p className="text-center text-xs text-muted-foreground">
                        Click a slot to select it
                    </p>
                </div>

                {/* Slot Media Editor */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">
                            Slot: <span className="text-primary">{selectedSlotId || "None selected"}</span>
                        </h3>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleUploadNavigate}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Media
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setIsMediaPickerOpen(true)}
                                disabled={!selectedSlotId}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Media
                            </Button>
                        </div>
                    </div>

                    {selectedSlotId && (
                        <ScrollArea className="h-[300px] border rounded-lg p-3">
                            {getSlotMedia(selectedSlotId).length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No media assigned to this slot</p>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => setIsMediaPickerOpen(true)}
                                    >
                                        Add media
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {getSlotMedia(selectedSlotId).map((sm, idx) => (
                                        <Card key={`${sm.slotId}-${sm.mediaId}`} className="p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="flex items-center gap-2 text-muted-foreground cursor-grab">
                                                    <GripVertical className="h-4 w-4" />
                                                    <span className="text-xs font-mono w-5">{idx + 1}</span>
                                                </div>

                                                <div className="flex-1 min-w-0 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        {getMediaIcon(sm.mediaType)}
                                                        <span className="font-medium truncate text-sm">
                                                            {sm.mediaName}
                                                        </span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {sm.mediaType}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Duration (sec)</Label>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                value={sm.durationSeconds}
                                                                onChange={(e) =>
                                                                    handleUpdateMediaSettings(
                                                                        sm.slotId,
                                                                        sm.mediaId,
                                                                        { durationSeconds: parseInt(e.target.value) || 10 }
                                                                    )
                                                                }
                                                                className="h-8"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Fit Mode</Label>
                                                            <Select
                                                                value={sm.fitMode}
                                                                onValueChange={(val: "cover" | "contain") =>
                                                                    handleUpdateMediaSettings(sm.slotId, sm.mediaId, {
                                                                        fitMode: val,
                                                                    })
                                                                }
                                                            >
                                                                <SelectTrigger className="h-8">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="cover">Cover</SelectItem>
                                                                    <SelectItem value="contain">Contain</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {sm.mediaType === "VIDEO" && (
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                id={`audio-${sm.mediaId}`}
                                                                checked={sm.audioEnabled}
                                                                onCheckedChange={(checked) =>
                                                                    handleUpdateMediaSettings(sm.slotId, sm.mediaId, {
                                                                        audioEnabled: checked,
                                                                    })
                                                                }
                                                            />
                                                            <Label
                                                                htmlFor={`audio-${sm.mediaId}`}
                                                                className="text-xs flex items-center gap-1"
                                                            >
                                                                {sm.audioEnabled ? (
                                                                    <Volume2 className="h-3 w-3" />
                                                                ) : (
                                                                    <VolumeX className="h-3 w-3" />
                                                                )}
                                                                Audio {sm.audioEnabled ? "On" : "Off"}
                                                            </Label>
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleRemoveMedia(sm.slotId, sm.mediaId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    )}

                    {/* Audio warning */}
                    {slotMedia.filter((sm) => sm.audioEnabled).length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            <Volume2 className="h-4 w-4" />
                            <span>
                                Only one slot can have audio enabled. Enabling audio elsewhere will disable
                                it on other slots.
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Media Picker Dialog */}
            <Dialog open={isMediaPickerOpen} onOpenChange={setIsMediaPickerOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between gap-3">
                            <DialogTitle>Select Media for "{selectedSlotId}"</DialogTitle>
                            <Button size="sm" variant="outline" onClick={handleUploadNavigate}>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Media
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <SearchBar placeholder="Search media..." onSearch={setMediaSearch} />
                            </div>
                            <Tabs value={mediaTypeFilter} onValueChange={setMediaTypeFilter}>
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="image">Images</TabsTrigger>
                                    <TabsTrigger value="video">Videos</TabsTrigger>
                                    <TabsTrigger value="document">Documents</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <LoadingIndicator label="Loading media..." />
                            </div>
                        ) : (
                            <ScrollArea className="h-[300px]">
                                {filteredMedia.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No media found</p>
                                        <Button variant="link" size="sm" onClick={handleUploadNavigate}>
                                            Upload media
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {filteredMedia.map((media) => {
                                            const mediaType = resolveMediaType(media);
                                            return (
                                                <Card
                                                    key={media.id}
                                                    onClick={() => handleAddMedia(media)}
                                                    className="p-3 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                                                >
                                                    <div className="space-y-3">
                                                        {renderMediaPreview(media, mediaType)}
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                                                                {getMediaIcon(mediaType)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate">
                                                                    {resolveMediaName(media)}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {mediaType}
                                                                    </Badge>
                                                                    {media.duration_seconds && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {media.duration_seconds}s
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        )}
                        {isFetching && !isLoading && (
                            <div className="text-xs text-muted-foreground">Refreshing...</div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMediaPickerOpen(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
