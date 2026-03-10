import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Image as ImageIcon, Video, FileText, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ToastAction } from "@/components/ui/toast";
import { mediaApi } from "@/api/domains/media";
import type { MediaAsset, MediaType } from "@/api/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getFriendlyUploadError,
  uploadMediaWithPresign,
  validateUploadFile,
  type UploadMediaResult,
} from "@/lib/mediaUploadFlow";
import { mapMediaDeleteError } from "@/lib/mediaDeleteErrors";

type MediaLibraryLocationState = {
  returnTo?: string;
  returnStep?: number;
  restoreDraft?: boolean;
  openUpload?: boolean;
};

export default function MediaLibrary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as MediaLibraryLocationState | null;
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadMediaResult | null>(null);
  const [previewMedia, setPreviewMedia] = useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [deleteMode, setDeleteMode] = useState<"soft" | "hard">("soft");

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return uploadMediaWithPresign(file, {
        onPrepared: (result) => {
          setUploadResult((previous) =>
            previous
              ? {
                  ...previous,
                  ...result,
                }
              : {
                  ...result,
                  media: {
                    id: "",
                    filename: result.file.name,
                  },
                },
          );
        },
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });
    },
    onSuccess: (result) => {
      const description = result.didCompress
        ? `Media uploaded. Compressed ${(result.originalSize / 1024 / 1024).toFixed(2)} MB -> ${(result.finalSize / 1024 / 1024).toFixed(2)} MB.`
        : "Media uploaded and marked ready.";
      toast({ title: "Upload complete", description });
      setIsUploadOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      void queryClient.invalidateQueries({ queryKey: ["media"] });
      if (locationState?.returnTo) {
        navigate(locationState.returnTo, {
          state: {
            step: locationState.returnStep ?? 2,
            restoreDraft: true,
          },
        });
      }
    },
    onError: (err) => {
      const message = getFriendlyUploadError(err);
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ mediaId, hard }: { mediaId: string; hard: boolean }) => {
      const response = await mediaApi.remove(mediaId, hard ? { hard: true } : undefined);
      return response as { message?: string } | void;
    },
    onSuccess: (res) => {
      const description = (res as { message?: string } | undefined)?.message ?? "Media deleted.";
      toast({ title: "Deleted", description });
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (err) => {
      const mapped = mapMediaDeleteError(err);
      if (mapped.dismissDeleteDialog) {
        setDeleteTarget(null);
      }
      if (err instanceof ApiError && err.code === "NOT_FOUND") {
        void queryClient.invalidateQueries({ queryKey: ["media"] });
      }
      toast({
        title: mapped.title,
        description: mapped.description,
        variant: mapped.variant,
        action:
          mapped.helpRoute && mapped.helpLabel ? (
            <ToastAction altText={mapped.helpLabel} onClick={() => navigate(mapped.helpRoute!)}>
              {mapped.helpLabel}
            </ToastAction>
          ) : undefined,
      });
    },
  });

  const typeFilter = (activeTab === "all" ? undefined : activeTab.toUpperCase()) as MediaType | undefined;

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["media", typeFilter],
    queryFn: () =>
      mediaApi.list({
        limit: 100,
        page: 1,
        status: "READY",
        type: typeFilter,
      }),
  });

  const isUploading = uploadMutation.isPending;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setUploadResult(null);
      setUploadProgress(0);
      return;
    }

    const validationError = validateUploadFile(file);
    if (validationError) {
      toast({
        title: "Unsupported file type",
        description: validationError,
        variant: "destructive",
      });
      input.value = "";
      setSelectedFile(null);
      setUploadResult(null);
      setUploadProgress(0);
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
    setUploadProgress(0);
  };

  const handleUpload = () => {
    if (!selectedFile || isUploading) return;
    setUploadResult(null);
    setUploadProgress(0);
    uploadMutation.mutate(selectedFile);
  };

  const handleCopyUrl = async (url?: string | null) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Copied", description: "Media URL copied to clipboard." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to copy URL.";
      toast({ title: "Copy failed", description: message, variant: "destructive" });
    }
  };

  const handlePreview = (item: MediaAsset) => {
    if (item.media_url) setPreviewMedia(item);
  };

  const closePreview = () => setPreviewMedia(null);

  const confirmDelete = (item: MediaAsset) => {
    setDeleteTarget(item);
    setDeleteMode("soft");
  };

  const handleDelete = () => {
    if (!deleteTarget || deleteMutation.isPending) return;
    deleteMutation.mutate({ mediaId: deleteTarget.id, hard: deleteMode === "hard" });
  };

  useEffect(() => {
    if (!isUploadOpen) setSelectedFile(null);
  }, [isUploadOpen]);

  useEffect(() => {
    if (locationState?.openUpload) {
      setIsUploadOpen(true);
    }
  }, [locationState?.openUpload]);

  useEffect(() => {
    if (isError) {
      const message = error instanceof ApiError ? error.message : "Unable to load media.";
      toast({ title: "Load failed", description: message, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const media = useMemo(() => data?.items ?? [], [data]);

  const filteredMedia = useMemo(
    () =>
      media.filter((item) => {
        if (item.status && item.status !== "READY") return false;
        const typeKey = (item.type || "").toUpperCase();
        const matchesTab =
          activeTab === "all" ||
          (activeTab === "image" && typeKey === "IMAGE") ||
          (activeTab === "video" && typeKey === "VIDEO") ||
          (activeTab === "document" && typeKey === "DOCUMENT");
        return matchesTab;
      }),
    [media, activeTab]
  );

  const stats = useMemo(() => {
    const total = media.length;
    const images = media.filter((m) => (m.type || "").toUpperCase() === "IMAGE").length;
    const videos = media.filter((m) => (m.type || "").toUpperCase() === "VIDEO").length;
    const documents = media.filter((m) => (m.type || "").toUpperCase() === "DOCUMENT").length;
    return { total, images, videos, documents };
  }, [media]);

  const resolveMediaLabel = (media: MediaAsset) => media.name || media.filename || "Untitled media";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Media Library</h1>
          <p className="text-muted-foreground mt-1">
            Browse uploaded assets that are ready for scheduling.
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Media
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Files" value={stats.total} icon={<FileText className="h-5 w-5 text-primary" />} />
        <StatCard title="Images" value={stats.images} icon={<ImageIcon className="h-5 w-5 text-blue-600" />} />
        <StatCard title="Videos" value={stats.videos} icon={<Video className="h-5 w-5 text-purple-600" />} />
        <StatCard title="Documents" value={stats.documents} icon={<FileText className="h-5 w-5 text-orange-600" />} />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
              <TabsTrigger value="video">Videos</TabsTrigger>
              <TabsTrigger value="document">Documents</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="text-sm text-muted-foreground">
            {isFetching ? "Refreshing..." : `${filteredMedia.length} items`}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedia.map((item: MediaAsset) => (
            <Card
              key={item.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handlePreview(item)}
            >
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="truncate">{resolveMediaLabel(item)}</span>
                  <Badge variant="outline">{item.type || "unknown"}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {item.media_url && (
                  <div className="overflow-hidden rounded-md border bg-muted/30">
                    {item.type === "IMAGE" || (item.content_type || "").startsWith("image/") ? (
                      <img
                        src={item.media_url}
                        alt={resolveMediaLabel(item)}
                        className="h-40 w-full object-cover"
                        loading="lazy"
                      />
                    ) : item.type === "VIDEO" || (item.content_type || "").startsWith("video/") ? (
                      <video
                        src={item.media_url}
                        className="h-40 w-full object-cover"
                        controls
                        preload="metadata"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="h-40 w-full flex flex-col items-center justify-center gap-2 text-center px-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <p className="text-xs text-muted-foreground">Document preview</p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyUrl(item.media_url);
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </Button>
                          <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                            <a href={item.media_url} target="_blank" rel="noreferrer">
                              Open
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {item.media_url && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(item.media_url);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(item);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
                {item.size && <div>Size: {(item.size / 1024 / 1024).toFixed(2)} MB</div>}
                {item.status && (
                  <Badge variant="secondary" className="text-xs">
                    {item.status}
                  </Badge>
                )}
                <div className="text-xs">
                  {/* Status : {item.status ?? "PENDING"} · Thumbnail: {item.thumbnail_object_id ?? "pending"} */}
                  Status : {item?.status ?? "PENDING"} 
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={isUploadOpen}
        onOpenChange={(open) => {
          setIsUploadOpen(open);
          if (!open) {
            setSelectedFile(null);
            setUploadResult(null);
            setUploadProgress(0);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="media-file">Select file</Label>
              <Input
                id="media-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,.mov,.mp4,.pdf,.ppt,.pptx,.csv,.doc,.docx"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
            {selectedFile && (
              <div className="rounded-md border p-3 text-sm text-muted-foreground space-y-2">
                <div className="flex items-center justify-between text-foreground">
                  <span className="font-medium truncate">{selectedFile.name}</span>
                  <Badge variant="outline">{selectedFile.type || "unknown"}</Badge>
                </div>
                <div>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                {uploadResult?.didCompress && (
                  <div className="text-xs text-emerald-700">
                    Compressed: {(uploadResult.originalSize / 1024 / 1024).toFixed(2)} MB {"->"}{" "}
                    {(uploadResult.finalSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
                {isUploading && (
                  <div className="space-y-1">
                    <Progress value={uploadProgress} className="h-1.5" />
                    <div className="text-[11px] text-muted-foreground">{uploadProgress}% uploaded</div>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              We request a presigned upload URL, upload directly to storage, then mark the media READY.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previewMedia && (
        <Dialog open={!!previewMedia} onOpenChange={(open) => (open ? null : closePreview())}>
          <DialogContent className="sm:max-w-[720px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="truncate">{resolveMediaLabel(previewMedia)}</span>
                {previewMedia.type && <Badge variant="outline">{previewMedia.type}</Badge>}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {previewMedia.media_url ? (
                previewMedia.type === "IMAGE" || (previewMedia.content_type || "").startsWith("image/") ? (
                  <img
                    src={previewMedia.media_url}
                    alt={resolveMediaLabel(previewMedia)}
                    className="w-full max-h-[480px] object-contain"
                  />
                ) : previewMedia.type === "VIDEO" || (previewMedia.content_type || "").startsWith("video/") ? (
                  <video
                    src={previewMedia.media_url}
                    className="w-full max-h-[480px]"
                    controls
                    preload="metadata"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-md border bg-muted/40 p-6 text-center">
                    <FileText className="h-10 w-10 text-primary" />
                    <p className="text-sm text-muted-foreground">Document preview unavailable. Open in a new tab.</p>
                    <Button variant="outline" asChild>
                      <a href={previewMedia.media_url} target="_blank" rel="noreferrer">
                        Open document
                      </a>
                    </Button>
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground">No media URL available.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closePreview}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={(open) => (open ? null : setDeleteTarget(null))}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Delete Media</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Choose soft delete to restrict usage, or hard delete to permanently remove the media and its storage
              references.
            </p>
            <div className="flex gap-2">
              <Button
                variant={deleteMode === "soft" ? "default" : "outline"}
                onClick={() => setDeleteMode("soft")}
              >
                Soft Delete
              </Button>
              <Button
                variant={deleteMode === "hard" ? "destructive" : "outline"}
                onClick={() => setDeleteMode("hard")}
              >
                Hard Delete
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : deleteMode === "hard" ? "Hard Delete" : "Soft Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}
