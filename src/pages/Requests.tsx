import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requestsApi, type RequestPayload } from "@/api/domains/requests";
import type { RequestTicket } from "@/api/types";
import { ApiError } from "@/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-500/10 text-blue-700",
  IN_PROGRESS: "bg-amber-500/10 text-amber-700",
  CLOSED: "bg-emerald-500/10 text-emerald-700",
};

export default function Requests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [payload, setPayload] = useState<RequestPayload>({ title: "", description: "", priority: "MEDIUM" });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["requests"],
    queryFn: () => requestsApi.list({ page: 1, limit: 100 }),
  });

  const requests = useMemo(() => data?.items ?? [], [data]);

  const createRequest = useMutation({
    mutationFn: (body: RequestPayload) => requestsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast({ title: "Request submitted", description: "Your content request has been created." });
      setIsCreateOpen(false);
      setPayload({ title: "", description: "", priority: "MEDIUM" });
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : "Unable to create request.";
      toast({ title: "Create failed", description: message, variant: "destructive" });
    },
  });

  const filtered = useMemo(
    () =>
      requests.filter((req) => {
        const q = searchQuery.toLowerCase();
        return (
          q === "" ||
          req.title.toLowerCase().includes(q) ||
          (req.description || "").toLowerCase().includes(q) ||
          (req.priority || "").toLowerCase().includes(q)
        );
      }),
    [requests, searchQuery]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Requests Workboard</h1>
          <p className="text-muted-foreground mt-1">Track incoming content and scheduling requests.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests by title, description, or priority..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {isFetching ? "Refreshing..." : `${filtered.length} requests`}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((request: RequestTicket) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{request.title}</CardTitle>
                  <Badge className={statusColors[request.status || "OPEN"] ?? "bg-secondary text-foreground"}>
                    {request.status || "OPEN"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="line-clamp-3">{request.description || "No description"}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{request.priority || "MEDIUM"}</Badge>
                  {request.assigned_to && <Badge variant="secondary">Assigned</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Request</DialogTitle>
            <DialogDescription>Submit a new content/scheduling request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="req-title">Title</Label>
              <Input
                id="req-title"
                value={payload.title}
                onChange={(e) => setPayload((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Q1 Campaign Assets"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-desc">Description</Label>
              <Textarea
                id="req-desc"
                value={payload.description}
                onChange={(e) => setPayload((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Add notes, links, or requirements"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={payload.priority || "MEDIUM"}
                onValueChange={(v) => setPayload((prev) => ({ ...prev, priority: v as RequestPayload["priority"] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={createRequest.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => createRequest.mutate({ ...payload, title: payload.title.trim() })}
              disabled={createRequest.isPending || !payload.title.trim()}
            >
              {createRequest.isPending ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
