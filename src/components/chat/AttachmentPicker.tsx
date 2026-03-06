import { useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileUp, Loader2, Plus, Search, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { mediaApi } from "@/api/domains/media";
import type { MediaAsset, MediaType } from "@/api/types";
import { useToast } from "@/hooks/use-toast";
import {
  createLocalPreviewUrl,
  getFriendlyUploadError,
  uploadFileToMedia,
  validateUploadFile,
} from "@/components/chat/mediaUpload";
import type { ChatPendingAttachment, ComposerUploadItem } from "@/components/chat/types";

interface AttachmentPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAttachments: (attachments: ChatPendingAttachment[]) => void;
}

const toPendingAttachment = (media: MediaAsset): ChatPendingAttachment => ({
  mediaId: media.id,
  fileName: media.filename,
  contentType: media.content_type,
  size: media.size,
  previewUrl: media.media_url,
});

const resolveType = (media: MediaAsset): string => {
  const type = (media.type || "").toUpperCase();
  if (type) return type;
  const contentType = media.content_type || "";
  if (contentType.startsWith("image/")) return "IMAGE";
  if (contentType.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
};

export function AttachmentPicker({ open, onOpenChange, onAddAttachments }: AttachmentPickerProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("existing");
  const [mediaType, setMediaType] = useState<"all" | "image" | "video" | "document">("all");
  const [uploadItems, setUploadItems] = useState<ComposerUploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const typeFilter = (mediaType === "all" ? undefined : mediaType.toUpperCase()) as MediaType | undefined;

  const mediaQuery = useQuery({
    queryKey: ["chat", "attachment-picker", typeFilter],
    queryFn: () =>
      mediaApi.list({
        page: 1,
        limit: 100,
        status: "READY",
        type: typeFilter,
      }),
    enabled: open && activeTab === "existing",
  });

  const mediaItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = mediaQuery.data?.items ?? [];
    if (!query) return items;
    return items.filter((item) => {
      const name = (item.filename || item.name || "").toLowerCase();
      return name.includes(query);
    });
  }, [mediaQuery.data?.items, search]);

  const updateUploadItem = (localId: string, updater: (item: ComposerUploadItem) => ComposerUploadItem) => {
    setUploadItems((prev) => prev.map((item) => (item.localId === localId ? updater(item) : item)));
  };

  const startUploads = (files: File[]) => {
    files.forEach((file) => {
      const validationError = validateUploadFile(file);
      if (validationError) {
        toast({ title: "Invalid file", description: validationError, variant: "destructive" });
        return;
      }

      const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const localPreviewUrl = createLocalPreviewUrl(file);

      setUploadItems((prev) => [
        {
          localId,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
          progress: 0,
          status: "queued",
          previewUrl: localPreviewUrl,
        },
        ...prev,
      ]);

      updateUploadItem(localId, (item) => ({ ...item, status: "uploading" }));

      uploadFileToMedia(file, (progress) => {
        updateUploadItem(localId, (item) => ({ ...item, progress, status: "uploading" }));
      })
        .then((media) => {
          if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);

          updateUploadItem(localId, (item) => ({
            ...item,
            mediaId: media.id,
            previewUrl: media.media_url ?? undefined,
            progress: 100,
            status: "uploaded",
            error: undefined,
          }));

          onAddAttachments([toPendingAttachment(media)]);
          toast({ title: "Upload complete", description: `${file.name} is ready to attach.` });
        })
        .catch((error: unknown) => {
          updateUploadItem(localId, (item) => ({
            ...item,
            status: "failed",
            error: getFriendlyUploadError(error),
          }));

          toast({
            title: "Upload failed",
            description: getFriendlyUploadError(error),
            variant: "destructive",
          });
        });
    });
  };

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    startUploads(files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length === 0) return;
    startUploads(files);
  };

  const clearCompleted = () => {
    setUploadItems((prev) => {
      prev.forEach((item) => {
        if (
          (item.status !== "uploaded" && item.status !== "failed") ||
          !item.previewUrl?.startsWith("blob:")
        ) {
          return;
        }
        URL.revokeObjectURL(item.previewUrl);
      });
      return prev.filter((item) => item.status !== "uploaded" && item.status !== "failed");
    });
  };

  const addExistingMedia = (media: MediaAsset) => {
    onAddAttachments([toPendingAttachment(media)]);
    toast({ title: "Attachment added", description: `${media.filename} added to message.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Attachments</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="existing">Existing Media</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search media..."
                  className="pl-9"
                />
              </div>
              <Tabs value={mediaType} onValueChange={(value) => setMediaType(value as typeof mediaType)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="image">Images</TabsTrigger>
                  <TabsTrigger value="video">Videos</TabsTrigger>
                  <TabsTrigger value="document">Docs</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {mediaQuery.isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-24" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[360px] pr-2">
                {mediaItems.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No media found.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {mediaItems.map((media) => (
                      <div key={media.id} className="rounded-md border p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{media.filename}</span>
                          <Badge variant="outline">{resolveType(media)}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{media.content_type || "unknown"}</div>
                        <Button size="sm" className="w-full" onClick={() => addExistingMedia(media)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isDragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Drag and drop files here</p>
              <p className="text-xs text-muted-foreground mt-1">
                Allowed: JPEG, PNG, WEBP, MP4, MOV, PDF, PPT/PPTX, CSV, DOC/DOCX.
              </p>
              <p className="text-xs text-muted-foreground">File size limits are enforced by server policy.</p>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose files
                    <input
                      className="hidden"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,.mov,.mp4,.pdf,.ppt,.pptx,.csv,.doc,.docx"
                      onChange={onFileInputChange}
                    />
                  </label>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Upload Queue</h4>
                <Button variant="ghost" size="sm" onClick={clearCompleted} disabled={uploadItems.length === 0}>
                  Clear completed
                </Button>
              </div>

              {uploadItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">No uploads yet.</p>
              ) : (
                <ScrollArea className="h-[220px] pr-2">
                  <div className="space-y-2">
                    {uploadItems.map((item) => (
                      <div key={item.localId} className="rounded-md border p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{item.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(item.size / 1024 / 1024).toFixed(2)} MB · {item.contentType}
                            </p>
                          </div>
                          <Badge variant={item.status === "failed" ? "destructive" : "secondary"}>
                            {item.status === "uploading" ? <Loader2 className="h-3 w-3 animate-spin" /> : item.status}
                          </Badge>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                        {item.error && <p className="text-xs text-destructive">{item.error}</p>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
