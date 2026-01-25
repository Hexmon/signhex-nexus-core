import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Video, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/common/SearchBar";
import { LoadingIndicator } from "@/components/common/LoadingIndicator";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { mediaApi } from "@/api/domains/media";
import { queryKeys } from "@/api/queryKeys";
import { useDefaultMedia, useUpdateDefaultMedia } from "@/hooks/useSettingsApi";
import { useToast } from "@/hooks/use-toast";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ApiError } from "@/api/apiClient";
import type { MediaAsset, MediaType } from "@/api/types";

const MEDIA_PAGE_SIZE = 100;

const resolveMediaType = (media: MediaAsset): MediaType => {
  if (media.type) {
    const type = media.type.toUpperCase();
    if (type === "IMAGE" || type === "VIDEO" || type === "DOCUMENT") {
      return type as MediaType;
    }
  }
  const contentType = media.content_type || "";
  if (contentType.startsWith("image/")) return "IMAGE";
  if (contentType.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
};

const resolveMediaName = (media: MediaAsset) => media.filename || media.name || "Untitled media";

const MediaPreview = ({ media, mediaType, sizeClass }: { media: MediaAsset; mediaType: MediaType; sizeClass: string }) => {
  if (!media.media_url) {
    return (
      <div className={`${sizeClass} rounded-md bg-muted flex items-center justify-center text-muted-foreground`}>
        {mediaType === "IMAGE" ? (
          <ImageIcon className="h-5 w-5" />
        ) : mediaType === "VIDEO" ? (
          <Video className="h-5 w-5" />
        ) : (
          <FileText className="h-5 w-5" />
        )}
      </div>
    );
  }

  if (mediaType === "IMAGE") {
    return (
      <div className={`${sizeClass} rounded-md overflow-hidden bg-muted`}>
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
      <div className={`${sizeClass} rounded-md overflow-hidden bg-muted`}>
        <video
          src={media.media_url}
          className="h-full w-full object-cover"
          muted
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-md bg-muted flex items-center justify-center text-muted-foreground`}>
      <FileText className="h-5 w-5" />
    </div>
  );
};

export function DefaultMediaSection() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdminOrSuperAdmin } = useAuthorization();
  const canEdit = isAdminOrSuperAdmin;

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");

  const defaultMediaQuery = useDefaultMedia();
  const updateDefaultMedia = useUpdateDefaultMedia();

  useEffect(() => {
    if (!defaultMediaQuery.isError) return;
    const message =
      defaultMediaQuery.error instanceof ApiError
        ? defaultMediaQuery.error.message
        : "Unable to load default media.";
    toast({ title: "Load failed", description: message, variant: "destructive" });
  }, [defaultMediaQuery.isError, defaultMediaQuery.error, toast]);

  const defaultMediaId = defaultMediaQuery.data?.media_id ?? defaultMediaQuery.data?.media?.id ?? null;
  const embeddedMedia = defaultMediaQuery.data?.media ?? null;

  const mediaDetailsQuery = useQuery({
    queryKey: queryKeys.mediaById(defaultMediaId ?? undefined),
    queryFn: () => mediaApi.getById(defaultMediaId!),
    enabled: Boolean(defaultMediaId) && !embeddedMedia,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!mediaDetailsQuery.isError) return;
    const message =
      mediaDetailsQuery.error instanceof ApiError
        ? mediaDetailsQuery.error.message
        : "Unable to load media details.";
    toast({ title: "Load failed", description: message, variant: "destructive" });
  }, [mediaDetailsQuery.isError, mediaDetailsQuery.error, toast]);

  const activeMedia = embeddedMedia ?? mediaDetailsQuery.data ?? null;
  const isDefaultLoading = defaultMediaQuery.isLoading || (defaultMediaId && mediaDetailsQuery.isLoading);

  const typeFilter = (mediaTypeFilter === "all"
    ? undefined
    : mediaTypeFilter.toUpperCase()) as MediaType | undefined;

  const mediaListQuery = useQuery({
    queryKey: ["media", "picker", typeFilter],
    queryFn: () =>
      mediaApi.list({
        limit: MEDIA_PAGE_SIZE,
        page: 1,
        status: "READY",
        type: typeFilter,
      }),
    enabled: isPickerOpen,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (!mediaListQuery.isError) return;
    const message =
      mediaListQuery.error instanceof ApiError
        ? mediaListQuery.error.message
        : "Unable to load media.";
    toast({ title: "Load failed", description: message, variant: "destructive" });
  }, [mediaListQuery.isError, mediaListQuery.error, toast]);

  const mediaItems = useMemo(() => mediaListQuery.data?.items ?? [], [mediaListQuery.data]);

  const filteredMedia = useMemo(() => {
    const query = mediaSearch.trim().toLowerCase();
    if (!query) return mediaItems;
    return mediaItems.filter((item) => {
      const name = (item.filename || item.name || "").toLowerCase();
      return name.includes(query);
    });
  }, [mediaItems, mediaSearch]);

  const handleSelectMedia = (media: MediaAsset) => {
    if (!canEdit || updateDefaultMedia.isPending) return;
    updateDefaultMedia.mutate(media.id, {
      onSuccess: () => setIsPickerOpen(false),
    });
  };

  const handleRemoveDefault = () => {
    if (!canEdit || updateDefaultMedia.isPending) return;
    updateDefaultMedia.mutate(null, {
      onSuccess: () => setIsRemoveDialogOpen(false),
    });
  };

  const handleUploadNavigate = () => {
    setIsPickerOpen(false);
    navigate("/media");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Media (CMS)</CardTitle>
        <CardDescription>Choose the fallback media shown when no content is scheduled.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isDefaultLoading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-24 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ) : !defaultMediaId ? (
          <p className="text-sm text-muted-foreground">No default media selected.</p>
        ) : activeMedia ? (
          <div className="flex flex-col md:flex-row md:items-center gap-4 rounded-lg border p-4">
            <MediaPreview media={activeMedia} mediaType={resolveMediaType(activeMedia)} sizeClass="h-24 w-full md:w-32" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{resolveMediaName(activeMedia)}</h3>
                <Badge variant="outline">{resolveMediaType(activeMedia)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{activeMedia.id}</p>
              {activeMedia.content_type && (
                <p className="text-xs text-muted-foreground">{activeMedia.content_type}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Unable to load default media details.</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPickerOpen(true)}
            disabled={!canEdit || updateDefaultMedia.isPending}
          >
            Select default media
          </Button>
          {defaultMediaId && (
            <Button
              variant="destructive"
              onClick={() => setIsRemoveDialogOpen(true)}
              disabled={!canEdit || updateDefaultMedia.isPending}
            >
              Remove default
            </Button>
          )}
        </div>
        {!canEdit && (
          <p className="text-xs text-muted-foreground">Only admins can update this setting.</p>
        )}
      </CardContent>

      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>Select Default Media</DialogTitle>
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

            {mediaListQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingIndicator label="Loading media..." />
              </div>
            ) : (
              <ScrollArea className="h-[320px]">
                {filteredMedia.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No media found</p>
                    <Button variant="link" size="sm" onClick={handleUploadNavigate}>
                      Upload media
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredMedia.map((media) => {
                      const mediaType = resolveMediaType(media);
                      const mediaName = resolveMediaName(media);
                      return (
                        <Card
                          key={media.id}
                          onClick={() => handleSelectMedia(media)}
                          className="p-3 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                        >
                          <div className="space-y-3">
                            <MediaPreview media={media} mediaType={mediaType} sizeClass="h-24 w-full" />
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                                {mediaType === "IMAGE" ? (
                                  <ImageIcon className="h-4 w-4" />
                                ) : mediaType === "VIDEO" ? (
                                  <Video className="h-4 w-4" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{mediaName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {mediaType}
                                  </Badge>
                                  {media.duration_seconds && (
                                    <span className="text-xs text-muted-foreground">{media.duration_seconds}s</span>
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
            {mediaListQuery.isFetching && !mediaListQuery.isLoading && (
              <div className="text-xs text-muted-foreground">Refreshing...</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPickerOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isRemoveDialogOpen}
        title="Remove default media?"
        description="This will clear the default media setting for the CMS."
        confirmLabel="Remove"
        onConfirm={handleRemoveDefault}
        onCancel={() => setIsRemoveDialogOpen(false)}
        isLoading={updateDefaultMedia.isPending}
        confirmDisabled={!canEdit}
      />
    </Card>
  );
}
