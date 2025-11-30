import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Upload, Image, Video, FileText, Presentation as PresentationIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mediaApi } from "@/api/domains/media";
import { presentationsApi } from "@/api/domains/presentations";
import type { MediaAsset } from "@/api/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function MediaLibrary() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["media"],
    queryFn: () => mediaApi.list({ limit: 100, page: 1 }),
  });

  const presentationsQuery = useQuery({
    queryKey: ["presentations"],
    queryFn: () => presentationsApi.list({ page: 1, limit: 20 }),
  });

  useEffect(() => {
    const err = error || presentationsQuery.error;
    if (isError || presentationsQuery.isError) {
      const message = err instanceof ApiError ? err.message : "Unable to load media.";
      toast({ title: "Load failed", description: message, variant: "destructive" });
    }
  }, [isError, error, toast, presentationsQuery.error, presentationsQuery.isError]);

  const media = useMemo(() => data?.items ?? [], [data]);
  const presentations = useMemo(() => presentationsQuery.data?.items ?? [], [presentationsQuery.data]);

  const filteredMedia = useMemo(
    () =>
      media.filter((item) => {
        const q = search.toLowerCase();
        const matchesSearch =
          q === "" ||
          item.filename.toLowerCase().includes(q) ||
          (item.content_type || "").toLowerCase().includes(q);
        const matchesTab =
          activeTab === "all" ||
          (activeTab === "image" && (item.content_type || "").startsWith("image")) ||
          (activeTab === "video" && (item.content_type || "").startsWith("video")) ||
          (activeTab === "document" &&
            !(item.content_type || "").startsWith("video") &&
            !(item.content_type || "").startsWith("image"));
        return matchesSearch && matchesTab;
      }),
    [media, search, activeTab]
  );

  const stats = useMemo(() => {
    const total = media.length;
    const images = media.filter((m) => (m.content_type || "").startsWith("image")).length;
    const videos = media.filter((m) => (m.content_type || "").startsWith("video")).length;
    const documents = total - images - videos;
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
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Upload via presigned URL (use CLI)
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Files" value={stats.total} icon={<FileText className="h-5 w-5 text-primary" />} />
        <StatCard title="Images" value={stats.images} icon={<Image className="h-5 w-5 text-blue-600" />} />
        <StatCard title="Videos" value={stats.videos} icon={<Video className="h-5 w-5 text-purple-600" />} />
        <StatCard title="Documents" value={stats.documents} icon={<FileText className="h-5 w-5 text-orange-600" />} />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
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
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="truncate">{item.filename}</span>
                  <Badge variant="outline">{item.content_type || "unknown"}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
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

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PresentationIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Presentations</CardTitle>
          </div>
          <Badge variant="outline">{presentations.length} items</Badge>
        </div>
        {presentationsQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
        ) : presentations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No presentations found.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {presentations.map((p) => (
              <Card key={p.id} className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <p>{p.description || "No description"}</p>
                  <p className="text-xs">Updated: {p.updated_at ?? p.created_at ?? "—"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Card>
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

