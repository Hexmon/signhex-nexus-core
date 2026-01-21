import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, AlertTriangle, Calendar, Clock, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { RequestDetailDrawer } from "@/components/schedule/RequestDetailDrawer";

interface Request {
  id: string;
  title: string;
  department: string;
  owner: string;
  status: "pending" | "in_review" | "approved" | "published" | "failed";
  priority: "low" | "medium" | "high" | "emergency";
  mediaCount: number;
  duration: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  conflictCount: number;
  targetScreens: number;
  createdAt: string;
  thumbnail?: string;
}

const mockRequests: Request[] = [
  {
    id: "REQ-2024-001",
    title: "Q1 Sales Campaign",
    department: "Marketing",
    owner: "Priya Sharma",
    status: "pending",
    priority: "high",
    mediaCount: 8,
    duration: "2m 45s",
    scheduledStart: "2024-03-01 09:00",
    scheduledEnd: "2024-03-31 18:00",
    conflictCount: 0,
    targetScreens: 12,
    createdAt: "2024-02-15 14:30",
  },
  {
    id: "REQ-2024-002",
    title: "Cafeteria Menu Display",
    department: "Facilities",
    owner: "Rajesh Kumar",
    status: "in_review",
    priority: "medium",
    mediaCount: 3,
    duration: "1m 20s",
    scheduledStart: "2024-02-20 11:00",
    scheduledEnd: "2024-02-20 15:00",
    conflictCount: 2,
    targetScreens: 4,
    createdAt: "2024-02-18 09:15",
  },
  {
    id: "REQ-2024-003",
    title: "Safety Training Video",
    department: "HR",
    owner: "Anjali Mehta",
    status: "approved",
    priority: "high",
    mediaCount: 1,
    duration: "12m 00s",
    scheduledStart: "2024-02-22 10:00",
    scheduledEnd: "2024-02-22 16:00",
    conflictCount: 0,
    targetScreens: 25,
    createdAt: "2024-02-10 11:45",
  },
  {
    id: "REQ-2024-004",
    title: "Product Launch Announcement",
    department: "Marketing",
    owner: "Vikram Singh",
    status: "published",
    priority: "emergency",
    mediaCount: 5,
    duration: "3m 15s",
    scheduledStart: "2024-02-19 09:00",
    scheduledEnd: "2024-02-25 18:00",
    conflictCount: 0,
    targetScreens: 45,
    createdAt: "2024-02-14 16:20",
  },
  {
    id: "REQ-2024-005",
    title: "Weekend Event Promo",
    department: "Events",
    owner: "Neha Gupta",
    status: "failed",
    priority: "low",
    mediaCount: 2,
    duration: "1m 45s",
    scheduledStart: "2024-02-17 12:00",
    scheduledEnd: "2024-02-18 22:00",
    conflictCount: 0,
    targetScreens: 8,
    createdAt: "2024-02-16 10:00",
  },
];

export default function ScheduleQueue() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const filteredRequests = mockRequests.filter(
    (req) =>
      req.status === activeTab &&
      (req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "emergency":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-warning text-warning-foreground";
      case "medium":
        return "bg-blue-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Panel - Request List */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schedule Queue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage playlists, approvals, and publishing workflow
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Emergency Takeover
            </Button>
            <Button size="sm" onClick={() => navigate("/schedule/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests by title, ID, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending">
              Pending
              <Badge variant="secondary" className="ml-2">
                {mockRequests.filter((r) => r.status === "pending").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="in_review">
              In Review
              <Badge variant="secondary" className="ml-2">
                {mockRequests.filter((r) => r.status === "in_review").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              <Badge variant="secondary" className="ml-2">
                {mockRequests.filter((r) => r.status === "approved").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="published">
              Published
              <Badge variant="secondary" className="ml-2">
                {mockRequests.filter((r) => r.status === "published").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="failed">
              Failed
              <Badge variant="secondary" className="ml-2">
                {mockRequests.filter((r) => r.status === "failed").length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No requests found</p>
                    <p className="text-sm mt-2">
                      {searchQuery
                        ? "Try adjusting your search terms"
                        : "Create a new request to get started"}
                    </p>
                  </div>
                ) : (
                  filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedRequest?.id === request.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                        }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{request.title}</h3>
                            <Badge className={getPriorityColor(request.priority)} variant="secondary">
                              {request.priority.toUpperCase()}
                            </Badge>
                            {request.conflictCount > 0 && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {request.conflictCount} Conflict{request.conflictCount > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {request.id} · {request.department} · {request.owner}
                          </p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Media</p>
                          <p className="font-medium">{request.mediaCount} items</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{request.duration}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Screens</p>
                          <p className="font-medium">{request.targetScreens}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium text-xs">{request.createdAt}</p>
                        </div>
                      </div>

                      {request.scheduledStart && (
                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {request.scheduledStart} → {request.scheduledEnd}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Detail Drawer */}
      {selectedRequest && (
        <RequestDetailDrawer request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}
    </div>
  );
}
