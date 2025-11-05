import { useState } from "react";
import { Search, Filter, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RequestDetailDrawer } from "@/components/requests/RequestDetailDrawer";

type RequestStatus = "pending" | "approved" | "rejected";
type RequestType = "content" | "schedule" | "screen" | "department";

interface Request {
  id: string;
  title: string;
  description: string;
  type: RequestType;
  status: RequestStatus;
  submittedBy: {
    name: string;
    avatar?: string;
    role: string;
  };
  submittedAt: string;
  priority: "low" | "medium" | "high";
  department?: string;
}

const mockRequests: Request[] = [
  {
    id: "REQ-001",
    title: "New promotional video upload",
    description: "Request to upload Q1 promotional video to lobby screens",
    type: "content",
    status: "pending",
    submittedBy: {
      name: "Sarah Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      role: "Marketing Manager",
    },
    submittedAt: "2024-03-15T10:30:00",
    priority: "high",
    department: "Marketing",
  },
  {
    id: "REQ-002",
    title: "Schedule change for cafeteria display",
    description: "Update lunch menu schedule for next week",
    type: "schedule",
    status: "pending",
    submittedBy: {
      name: "Michael Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      role: "Cafeteria Manager",
    },
    submittedAt: "2024-03-15T09:15:00",
    priority: "medium",
    department: "Operations",
  },
  {
    id: "REQ-003",
    title: "Add new screen to reception",
    description: "Install and configure new display screen at main reception",
    type: "screen",
    status: "approved",
    submittedBy: {
      name: "David Miller",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      role: "IT Coordinator",
    },
    submittedAt: "2024-03-14T14:20:00",
    priority: "high",
    department: "IT",
  },
  {
    id: "REQ-004",
    title: "Create HR department section",
    description: "Request to create dedicated section for HR announcements",
    type: "department",
    status: "rejected",
    submittedBy: {
      name: "Emma Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      role: "HR Director",
    },
    submittedAt: "2024-03-14T11:00:00",
    priority: "low",
    department: "HR",
  },
  {
    id: "REQ-005",
    title: "Emergency alert content",
    description: "Upload emergency evacuation procedure slides",
    type: "content",
    status: "approved",
    submittedBy: {
      name: "John Smith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
      role: "Safety Officer",
    },
    submittedAt: "2024-03-13T16:45:00",
    priority: "high",
    department: "Safety",
  },
];

const Requests = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredRequests = mockRequests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.submittedBy.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && request.status === "pending") ||
      (activeTab === "approved" && request.status === "approved") ||
      (activeTab === "rejected" && request.status === "rejected");

    return matchesSearch && matchesTab;
  });

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    } as const;

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-blue-100 text-blue-800 border-blue-200",
    };

    return (
      <Badge variant="outline" className={colors[priority as keyof typeof colors]}>
        {priority}
      </Badge>
    );
  };

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request);
    setDrawerOpen(true);
  };

  const handleApprove = (requestId: string) => {
    console.log("Approving request:", requestId);
    // Handle approval logic
  };

  const handleReject = (requestId: string) => {
    console.log("Rejecting request:", requestId);
    // Handle rejection logic
  };

  const pendingCount = mockRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
        <p className="text-muted-foreground">
          Review and manage content, schedule, and system requests
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No requests found</p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.submittedBy.avatar} />
                        <AvatarFallback>
                          {request.submittedBy.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(request.status)}
                              <h3 className="font-semibold">{request.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {request.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(request.status)}
                            {getPriorityBadge(request.priority)}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            <strong>{request.submittedBy.name}</strong> •{" "}
                            {request.submittedBy.role}
                          </span>
                          {request.department && (
                            <>
                              <span>•</span>
                              <span>{request.department}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(request.submittedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <Badge variant="outline" className="capitalize">
                            {request.type}
                          </Badge>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRequest(request)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                          {request.status === "pending" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(request.id)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(request.id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <RequestDetailDrawer
        request={selectedRequest}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};

export default Requests;
