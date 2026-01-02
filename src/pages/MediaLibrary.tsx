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
import { mediaApi } from "@/api/domains/media";
import type { MediaAsset, MediaType } from "@/api/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/api/apiClient";
import { useToast } from "@/hooks/use-toast";

export default function MediaLibrary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewMedia, setPreviewMedia] = useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [deleteMode, setDeleteMode] = useState<"soft" | "hard">("soft");

  const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/quicktime", // mov
    "application/pdf",
    "application/vnd.ms-powerpoint", // ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
    "text/csv",
    "application/msword", // doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  ]);
  const allowedExtensions = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".mp4",
    ".mov",
    ".pdf",
    ".ppt",
    ".pptx",
    ".csv",
    ".doc",
    ".docx",
  ]);

  const readMediaMetadata = (file: File) =>
    new Promise<Partial<{ width: number; height: number; duration_seconds: number }>>((resolve) => {
      if (typeof window === "undefined") return resolve({});
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
          URL.revokeObjectURL(url);
        };
        img.onerror = () => {
          resolve({});
          URL.revokeObjectURL(url);
        };
        img.src = url;
        return;
      }
      if (file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          resolve({
            width: video.videoWidth || undefined,
            height: video.videoHeight || undefined,
            duration_seconds: isNaN(video.duration) ? undefined : Math.round(video.duration),
          });
          URL.revokeObjectURL(url);
        };
        video.onerror = () => {
          resolve({});
          URL.revokeObjectURL(url);
        };
        video.src = url;
        return;
      }
      resolve({});
    });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const contentType = file.type || "application/octet-stream";
      const presign = await mediaApi.presignUpload({
        filename: file.name,
        content_type: contentType,
        size: file.size,
      });

      const uploadResponse = await fetch(presign.upload_url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!uploadResponse.ok) {
        const message = await uploadResponse.text().catch(() => "");
        throw new Error(message || "Upload failed.");
      }

      const metadata = await readMediaMetadata(file);
      return mediaApi.complete(presign.media_id, {
        status: "READY",
        content_type: contentType,
        size: file.size,
        ...metadata,
      });
    },
    onSuccess: () => {
      toast({ title: "Upload complete", description: "Media uploaded and marked ready." });
      setIsUploadOpen(false);
      setSelectedFile(null);
      void queryClient.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Upload failed.";
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
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Delete failed.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
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
      return;
    }

    const ext = file.name.includes(".") ? file.name.substring(file.name.lastIndexOf(".")).toLowerCase() : "";
    const isAllowed = allowedMimeTypes.has(file.type) || (ext && allowedExtensions.has(ext));
    if (!isAllowed) {
      toast({
        title: "Unsupported file type",
        description: "Allowed: JPEG, PNG, WEBP, MP4, MOV, PDF, PPT/PPTX, CSV, DOC/DOCX.",
        variant: "destructive",
      });
      input.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile || isUploading) return;
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
                  <span className="truncate">{item.filename}</span>
                  <Badge variant="outline">{item.content_type || "unknown"}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {item.media_url && (
                  <div className="overflow-hidden rounded-md border bg-muted/30">
                    {item.type === "IMAGE" || (item.content_type || "").startsWith("image/") ? (
                      <img
                        src={item.media_url}
                        alt={item.filename}
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
                  Ready object: {item.ready_object_id ?? "pending"} · Thumbnail: {item.thumbnail_object_id ?? "pending"}
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
          if (!open) setSelectedFile(null);
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
              <div className="rounded-md border p-3 text-sm text-muted-foreground space-y-1">
                <div className="flex items-center justify-between text-foreground">
                  <span className="font-medium truncate">{selectedFile.name}</span>
                  <Badge variant="outline">{selectedFile.type || "unknown"}</Badge>
                </div>
                <div>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
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
                <span className="truncate">{previewMedia.filename}</span>
                {previewMedia.type && <Badge variant="outline">{previewMedia.type}</Badge>}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {previewMedia.media_url ? (
                previewMedia.type === "IMAGE" || (previewMedia.content_type || "").startsWith("image/") ? (
                  <img
                    src={previewMedia.media_url}
                    alt={previewMedia.filename}
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
