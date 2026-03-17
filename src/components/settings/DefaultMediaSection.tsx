import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Video, FileText, Upload, MonitorPlay } from "lucide-react";
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
import { screensApi } from "@/api/domains/screens";
import { queryKeys } from "@/api/queryKeys";
import {
  useDefaultMedia,
  useDefaultMediaVariants,
  useUpdateDefaultMedia,
  useUpdateDefaultMediaVariants,
} from "@/hooks/useSettingsApi";
import { useToast } from "@/hooks/use-toast";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ApiError } from "@/api/apiClient";
import type { DefaultMediaVariantSetting, MediaAsset, MediaType, ScreenAspectRatio } from "@/api/types";
import { resolveMediaDisplayName } from "@/lib/media";

const MEDIA_PAGE_SIZE = 100;

type PickerTarget =
  | { type: "global" }
  | { type: "variant"; aspectRatio: string };

type RemoveTarget = PickerTarget | null;

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

const resolveMediaName = (media: MediaAsset) => resolveMediaDisplayName(media);

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

const mergeAspectRatios = (
  catalog: ScreenAspectRatio[] | undefined,
  variants: DefaultMediaVariantSetting[] | undefined,
): ScreenAspectRatio[] => {
  const merged = new Map<string, ScreenAspectRatio>();
  for (const item of [...(catalog || []), ...(variants || []).map((entry) => ({
    id: null,
    name: entry.aspect_ratio,
    aspect_ratio: entry.aspect_ratio,
    aspect_ratio_name: entry.aspect_ratio,
    is_fallback: false,
  }))]) {
    if (!item.aspect_ratio) continue;
    if (!merged.has(item.aspect_ratio)) {
      merged.set(item.aspect_ratio, item);
    }
  }
  return Array.from(merged.values()).sort((left, right) => (left.aspect_ratio || "").localeCompare(right.aspect_ratio || ""));
};

const MediaSummary = ({ media }: { media: MediaAsset | null }) => {
  if (!media) {
    return <p className="text-sm text-muted-foreground">No media assigned.</p>;
  }

  const mediaType = resolveMediaType(media);
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 rounded-lg border p-4">
      <MediaPreview media={media} mediaType={mediaType} sizeClass="h-24 w-full md:w-32" />
      <div className="space-y-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium truncate">{resolveMediaName(media)}</h3>
          <Badge variant="outline">{mediaType}</Badge>
        </div>
        <p className="text-xs text-muted-foreground font-mono break-all">{media.id}</p>
        {media.content_type && <p className="text-xs text-muted-foreground">{media.content_type}</p>}
      </div>
    </div>
  );
};

export function DefaultMediaSection() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdminOrSuperAdmin } = useAuthorization();
  const canEdit = isAdminOrSuperAdmin;

  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget>(null);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");

  const defaultMediaQuery = useDefaultMedia();
  const defaultMediaVariantsQuery = useDefaultMediaVariants();
  const updateDefaultMedia = useUpdateDefaultMedia();
  const updateDefaultMediaVariants = useUpdateDefaultMediaVariants();

  const isPickerOpen = pickerTarget !== null;
  const isRemoveDialogOpen = removeTarget !== null;
  const isSaving = updateDefaultMedia.isPending || updateDefaultMediaVariants.isPending;

  useEffect(() => {
    if (!defaultMediaQuery.isError) return;
    const message =
      defaultMediaQuery.error instanceof ApiError
        ? defaultMediaQuery.error.message
        : "Unable to load default media.";
    toast({ title: "Load failed", description: message, variant: "destructive" });
  }, [defaultMediaQuery.isError, defaultMediaQuery.error, toast]);

  useEffect(() => {
    if (!defaultMediaVariantsQuery.isError) return;
    const message =
      defaultMediaVariantsQuery.error instanceof ApiError
        ? defaultMediaVariantsQuery.error.message
        : "Unable to load default media variants.";
    toast({ title: "Load failed", description: message, variant: "destructive" });
  }, [defaultMediaVariantsQuery.isError, defaultMediaVariantsQuery.error, toast]);

  const globalMediaId = defaultMediaQuery.data?.media_id ?? defaultMediaQuery.data?.media?.id ?? null;
  const embeddedGlobalMedia = defaultMediaQuery.data?.media ?? null;

  const mediaDetailsQuery = useQuery({
    queryKey: queryKeys.mediaById(globalMediaId ?? undefined),
    queryFn: () => mediaApi.getById(globalMediaId!),
    enabled: Boolean(globalMediaId) && !embeddedGlobalMedia,
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

  const aspectRatiosQuery = useQuery({
    queryKey: ["screen-aspect-ratios", "default-media"],
    queryFn: () => screensApi.listAspectRatios(),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!aspectRatiosQuery.isError) return;
    const message =
      aspectRatiosQuery.error instanceof ApiError
        ? aspectRatiosQuery.error.message
        : "Unable to load aspect ratios.";
    toast({ title: "Load failed", description: message, variant: "destructive" });
  }, [aspectRatiosQuery.isError, aspectRatiosQuery.error, toast]);

  const activeGlobalMedia = embeddedGlobalMedia ?? mediaDetailsQuery.data ?? null;
  const variantEntries = defaultMediaVariantsQuery.data?.variants ?? [];
  const variantByAspectRatio = useMemo(
    () =>
      variantEntries.reduce<Record<string, DefaultMediaVariantSetting>>((acc, entry) => {
        acc[entry.aspect_ratio] = entry;
        return acc;
      }, {}),
    [variantEntries],
  );

  const aspectRatioOptions = useMemo(() => {
    const catalog = [
      ...(aspectRatiosQuery.data?.defaults ?? []),
      ...(aspectRatiosQuery.data?.items ?? []),
    ];
    return mergeAspectRatios(catalog, variantEntries);
  }, [aspectRatiosQuery.data, variantEntries]);

  const typeFilter = (mediaTypeFilter === "all" ? undefined : mediaTypeFilter.toUpperCase()) as MediaType | undefined;

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
      mediaListQuery.error instanceof ApiError ? mediaListQuery.error.message : "Unable to load media.";
    toast({ title: "Load failed", description: message, variant: "destructive" });
  }, [mediaListQuery.isError, mediaListQuery.error, toast]);

  const mediaItems = useMemo(() => mediaListQuery.data?.items ?? [], [mediaListQuery.data]);
  const filteredMedia = useMemo(() => {
    const query = mediaSearch.trim().toLowerCase();
    if (!query) return mediaItems;
    return mediaItems.filter((item) => {
      const name = resolveMediaDisplayName(item).toLowerCase();
      return name.includes(query);
    });
  }, [mediaItems, mediaSearch]);

  const buildNextVariants = (aspectRatio: string, mediaId: string | null) => {
    const next = Object.fromEntries(variantEntries.map((entry) => [entry.aspect_ratio, entry.media_id]));
    next[aspectRatio] = mediaId;
    return next;
  };

  const handleSelectMedia = (media: MediaAsset) => {
    if (!pickerTarget || !canEdit || isSaving) return;

    if (pickerTarget.type === "global") {
      updateDefaultMedia.mutate(media.id, {
        onSuccess: () => setPickerTarget(null),
      });
      return;
    }

    updateDefaultMediaVariants.mutate(buildNextVariants(pickerTarget.aspectRatio, media.id), {
      onSuccess: () => setPickerTarget(null),
    });
  };

  const handleRemove = () => {
    if (!removeTarget || !canEdit || isSaving) return;

    if (removeTarget.type === "global") {
      updateDefaultMedia.mutate(null, {
        onSuccess: () => setRemoveTarget(null),
      });
      return;
    }

    updateDefaultMediaVariants.mutate(buildNextVariants(removeTarget.aspectRatio, null), {
      onSuccess: () => setRemoveTarget(null),
    });
  };

  const handleUploadNavigate = () => {
    setPickerTarget(null);
    navigate("/media");
  };

  const pickerTitle = pickerTarget?.type === "variant"
    ? `Select Default Media for ${pickerTarget.aspectRatio}`
    : "Select Global Default Media";

  const removeDescription = removeTarget?.type === "variant"
    ? `This will clear the default media for ${removeTarget.aspectRatio}. Screens with that aspect ratio will fall back to the global default if one is configured.`
    : "This will clear the global default media setting. Only aspect-ratio-specific defaults will remain.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Media</CardTitle>
        <CardDescription>
          When nothing is scheduled, the player will use aspect-ratio-specific fallback first, then the global default.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Fallback precedence</p>
          <p>1. Aspect-ratio default media</p>
          <p>2. Global default media</p>
          <p>3. Empty/idle state if no fallback is configured</p>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-medium">Global default media</h3>
              <p className="text-sm text-muted-foreground">Used only when no aspect-ratio-specific fallback matches the screen.</p>
            </div>
            <Badge variant="secondary">Fallback tier 2</Badge>
          </div>

          {defaultMediaQuery.isLoading || (globalMediaId && mediaDetailsQuery.isLoading) ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : (
            <MediaSummary media={activeGlobalMedia} />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              aria-label="Select global default media"
              onClick={() => setPickerTarget({ type: "global" })}
              disabled={!canEdit || isSaving}
            >
              Select global default
            </Button>
            {globalMediaId && (
              <Button
                variant="destructive"
                aria-label="Clear global default media"
                onClick={() => setRemoveTarget({ type: "global" })}
                disabled={!canEdit || isSaving}
              >
                Clear global default
              </Button>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-medium">Aspect-ratio fallback variants</h3>
              <p className="text-sm text-muted-foreground">These override the global default for matching screens.</p>
            </div>
            <Badge variant="secondary">Fallback tier 1</Badge>
          </div>

          {aspectRatiosQuery.isLoading && !aspectRatioOptions.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-44 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {aspectRatioOptions.map((ratio) => {
                const aspectRatio = ratio.aspect_ratio;
                if (!aspectRatio) return null;
                const variant = variantByAspectRatio[aspectRatio];
                return (
                  <Card key={aspectRatio} className="border-muted-foreground/20">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <MonitorPlay className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{aspectRatio}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{ratio.aspect_ratio_name || ratio.name || "Custom ratio"}</p>
                        </div>
                        <Badge variant={variant?.media_id ? "default" : "outline"}>
                          {variant?.media_id ? "Configured" : "Uses global"}
                        </Badge>
                      </div>

                      <MediaSummary media={variant?.media ?? null} />

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Assign default media for ${aspectRatio}`}
                          onClick={() => setPickerTarget({ type: "variant", aspectRatio })}
                          disabled={!canEdit || isSaving}
                        >
                          {variant?.media_id ? "Replace media" : "Assign media"}
                        </Button>
                        {variant?.media_id && (
                          <Button
                            variant="destructive"
                            size="sm"
                            aria-label={`Clear default media for ${aspectRatio}`}
                            onClick={() => setRemoveTarget({ type: "variant", aspectRatio })}
                            disabled={!canEdit || isSaving}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {!canEdit && <p className="text-xs text-muted-foreground">Only admins can update these settings.</p>}
      </CardContent>

      <Dialog open={isPickerOpen} onOpenChange={(open) => !open && setPickerTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>{pickerTitle}</DialogTitle>
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
            <Button variant="outline" onClick={() => setPickerTarget(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isRemoveDialogOpen}
        title={removeTarget?.type === "variant" ? `Clear ${removeTarget.aspectRatio} default media?` : "Clear global default media?"}
        description={removeDescription}
        confirmLabel="Clear"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
        isLoading={isSaving}
        confirmDisabled={!canEdit}
      />
    </Card>
  );
}
