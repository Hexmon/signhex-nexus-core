import { useState } from "react";
import { Search, Filter, Plus, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KanbanBoard, KanbanRequest } from "@/components/requests/KanbanBoard";
import { ComprehensiveDetailDrawer } from "@/components/requests/ComprehensiveDetailDrawer";
import { RejectReasonModal } from "@/components/requests/RejectReasonModal";
import { EmergencyTakeoverModal, TakeoverConfig } from "@/components/requests/EmergencyTakeoverModal";
import { useToast } from "@/hooks/use-toast";

// Mock data converted to Kanban format
const mockKanbanRequests: KanbanRequest[] = [
  {
    id: "REQ-2024-001",
    title: "Q1 Sales Campaign - Digital Signage",
    department: "Marketing",
    owner: "Priya Sharma",
    status: "submitted",
    priority: "high",
    mediaCount: 8,
    targetScreens: 12,
    thumbnail: "https://images.unsplash.com/photo-1557821552-17105176677c?w=400",
    expiresAt: "Mar 31, 2024",
    conflictCount: 0,
    createdAt: "Feb 15, 2024 2:30 PM",
  },
  {
    id: "REQ-2024-002",
    title: "Employee Safety Training Video",
    department: "HR",
    owner: "Anjali Mehta",
    status: "in_progress",
    priority: "medium",
    mediaCount: 1,
    targetScreens: 25,
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400",
    createdAt: "Feb 10, 2024 11:45 AM",
  },
  {
    id: "REQ-2024-003",
    title: "Cafeteria Menu Display - Weekly Update",
    department: "Facilities",
    owner: "Rajesh Kumar",
    status: "dept_review",
    priority: "low",
    mediaCount: 3,
    targetScreens: 4,
    conflictCount: 2,
    createdAt: "Feb 18, 2024 9:15 AM",
  },
  {
    id: "REQ-2024-004",
    title: "Product Launch Announcement",
    department: "Marketing",
    owner: "Vikram Singh",
    status: "admin_approval",
    priority: "emergency",
    mediaCount: 5,
    targetScreens: 45,
    thumbnail: "https://images.unsplash.com/photo-1556155092-490a1ba16284?w=400",
    expiresAt: "Feb 25, 2024",
    createdAt: "Feb 14, 2024 4:20 PM",
  },
  {
    id: "REQ-2024-005",
    title: "IT Department Town Hall Meeting",
    department: "Engineering",
    owner: "Neha Gupta",
    status: "scheduled",
    priority: "medium",
    mediaCount: 2,
    targetScreens: 8,
    createdAt: "Feb 16, 2024 10:00 AM",
  },
  {
    id: "REQ-2024-006",
    title: "Holiday Promo Campaign - Completed",
    department: "Marketing",
    owner: "Sarah Chen",
    status: "completed",
    priority: "low",
    mediaCount: 4,
    targetScreens: 20,
    createdAt: "Jan 15, 2024 3:45 PM",
  },
];

export default function Requests() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<KanbanRequest | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isTakeoverModalOpen, setIsTakeoverModalOpen] = useState(false);
  const [requests, setRequests] = useState<KanbanRequest[]>(mockKanbanRequests);
  const { toast } = useToast();

  const filteredRequests = requests.filter((request) =>
    searchQuery === "" ||
    request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = (requestId: string, newStatus: any) => {
    setRequests(requests.map(req => 
      req.id === requestId ? { ...req, status: newStatus } : req
    ));
    toast({
      title: "Status Updated",
      description: `Request moved to ${newStatus.replace('_', ' ')}`,
    });
  };

  const handleApprove = () => {
    if (!selectedRequest) return;
    handleStatusChange(selectedRequest.id, "scheduled");
    toast({
      title: "Request Approved",
      description: `${selectedRequest.title} has been approved and scheduled.`,
    });
  };

  const handleReject = (reason: string) => {
    if (!selectedRequest) return;
    console.log("Rejecting request with reason:", reason);
    handleStatusChange(selectedRequest.id, "submitted");
    toast({
      title: "Request Rejected",
      description: `${selectedRequest.title} has been rejected and returned to department.`,
      variant: "destructive",
    });
  };

  const handleRequestChanges = () => {
    setIsRejectModalOpen(true);
  };

  const handleEmergencyTakeover = (config: TakeoverConfig) => {
    console.log("Emergency takeover activated:", config);
    toast({
      title: "Emergency Takeover Activated",
      description: `${config.title} is now live on ${config.scope === 'all' ? 'all screens' : 'selected screens'} for ${config.duration} minutes.`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Requests Workboard</h1>
          <p className="text-muted-foreground mt-1">
            Drag and drop requests between workflow stages
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTakeoverModalOpen(true)}>
            <Zap className="mr-2 h-4 w-4" />
            Emergency Takeover
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests by title, department, or owner..."
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

      <div className="flex-1 overflow-hidden flex gap-4">
        <div className="flex-1">
          <KanbanBoard
            requests={filteredRequests}
            onRequestClick={(request) => setSelectedRequest(request)}
            onStatusChange={handleStatusChange}
          />
        </div>

        {selectedRequest && (
          <ComprehensiveDetailDrawer
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onApprove={handleApprove}
            onReject={() => setIsRejectModalOpen(true)}
            onRequestChanges={handleRequestChanges}
          />
        )}
      </div>

      {/* Reject Reason Modal */}
      <RejectReasonModal
        open={isRejectModalOpen}
        onOpenChange={setIsRejectModalOpen}
        requestTitle={selectedRequest?.title || ""}
        onConfirm={handleReject}
      />

      {/* Emergency Takeover Modal */}
      <EmergencyTakeoverModal
        open={isTakeoverModalOpen}
        onOpenChange={setIsTakeoverModalOpen}
        onConfirm={handleEmergencyTakeover}
      />
    </div>
  );
}
