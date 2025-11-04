import { useState } from "react";
import { Search, Upload, Image, Video, FileText, Download, Trash2, Eye, Filter, Grid3x3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentTypeBadge } from "@/components/dashboard/ContentTypeBadge";

type MediaFile = {
  id: string;
  name: string;
  type: "image" | "video" | "pdf" | "document";
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  department: string;
  usedIn: number;
  thumbnail?: string;
  duration?: string;
};

const mockMedia: MediaFile[] = [
  {
    id: "MED-001",
    name: "black-friday-banner.jpg",
    type: "image",
    size: "2.4 MB",
    uploadedBy: "Sarah Chen",
    uploadedAt: "2024-01-15",
    department: "Marketing",
    usedIn: 3,
    thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400"
  },
  {
    id: "MED-002",
    name: "product-demo.mp4",
    type: "video",
    size: "45.8 MB",
    uploadedBy: "Mike Johnson",
    uploadedAt: "2024-01-14",
    department: "Sales",
    usedIn: 5,
    duration: "2:34",
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400"
  },
  {
    id: "MED-003",
    name: "weekly-menu.pdf",
    type: "pdf",
    size: "1.2 MB",
    uploadedBy: "Jennifer Lopez",
    uploadedAt: "2024-01-14",
    department: "Food & Beverage",
    usedIn: 2
  },
  {
    id: "MED-004",
    name: "training-slide-deck.pdf",
    type: "pdf",
    size: "8.5 MB",
    uploadedBy: "David Kim",
    uploadedAt: "2024-01-13",
    department: "HR",
    usedIn: 1
  },
  {
    id: "MED-005",
    name: "corporate-logo.png",
    type: "image",
    size: "356 KB",
    uploadedBy: "Admin",
    uploadedAt: "2024-01-10",
    department: "Marketing",
    usedIn: 12,
    thumbnail: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400"
  },
  {
    id: "MED-006",
    name: "safety-instructions.mp4",
    type: "video",
    size: "28.3 MB",
    uploadedBy: "Sarah Chen",
    uploadedAt: "2024-01-12",
    department: "IT Operations",
    usedIn: 4,
    duration: "1:45",
    thumbnail: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400"
  },
  {
    id: "MED-007",
    name: "holiday-promotion.jpg",
    type: "image",
    size: "3.1 MB",
    uploadedBy: "Mike Johnson",
    uploadedAt: "2024-01-11",
    department: "Marketing",
    usedIn: 6,
    thumbnail: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400"
  },
  {
    id: "MED-008",
    name: "employee-handbook.pdf",
    type: "pdf",
    size: "5.7 MB",
    uploadedBy: "Jennifer Lopez",
    uploadedAt: "2024-01-09",
    department: "HR",
    usedIn: 8
  }
];

export default function MediaLibrary() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const filteredMedia = mockMedia.filter(media => {
    const matchesSearch = search === "" || 
      media.name.toLowerCase().includes(search.toLowerCase()) ||
      media.department.toLowerCase().includes(search.toLowerCase()) ||
      media.uploadedBy.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = activeTab === "all" || media.type === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: mockMedia.length,
    images: mockMedia.filter(m => m.type === "image").length,
    videos: mockMedia.filter(m => m.type === "video").length,
    documents: mockMedia.filter(m => m.type === "pdf" || m.type === "document").length,
    totalSize: "95.6 MB"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Media Library</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize all media files for digital signage
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Media Files</DialogTitle>
                <DialogDescription>
                  Upload images, videos, or documents to the media library
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, MP4, PDF up to 100MB
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="it">IT Operations</SelectItem>
                      <SelectItem value="fb">Food & Beverage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsUploadDialogOpen(false)}>
                  Upload
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Files</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Image className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Images</p>
              <p className="text-2xl font-bold text-blue-600">{stats.images}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Video className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Videos</p>
              <p className="text-2xl font-bold text-purple-600">{stats.videos}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Documents</p>
              <p className="text-2xl font-bold text-orange-600">{stats.documents}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
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
              <TabsTrigger value="pdf">Documents</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-1 border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Media Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMedia.map((media) => (
            <Card key={media.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-accent flex items-center justify-center relative">
                {media.thumbnail ? (
                  <img src={media.thumbnail} alt={media.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="h-12 w-12 text-muted-foreground" />
                )}
                {media.duration && (
                  <Badge className="absolute bottom-2 right-2" variant="secondary">
                    {media.duration}
                  </Badge>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-sm line-clamp-1" title={media.name}>
                    {media.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{media.size}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ContentTypeBadge type={media.type} />
                  <Badge variant="outline" className="text-xs">{media.department}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Uploaded by {media.uploadedBy}</p>
                  <p>Used in {media.usedIn} presentations</p>
                </div>
                <div className="flex gap-1 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredMedia.map((media) => (
              <div key={media.id} className="p-4 hover:bg-accent transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-accent rounded flex items-center justify-center flex-shrink-0">
                    {media.thumbnail ? (
                      <img src={media.thumbnail} alt={media.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{media.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <ContentTypeBadge type={media.type} />
                      <span className="text-xs text-muted-foreground">{media.size}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <Badge variant="outline" className="text-xs">{media.department}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <p>By {media.uploadedBy}</p>
                    <p className="text-xs">{media.uploadedAt}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
