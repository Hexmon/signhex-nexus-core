import { useEffect, useMemo, useState } from "react";
import { Monitor, HardDrive, Calendar, Activity, Plus, AlertTriangle } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { metricsApi } from "@/api/domains/metrics";
import { ApiError } from "@/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/store/hooks";

export default function Dashboard() {
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const { toast } = useToast();
  const authToken = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = Boolean(authToken || user);

  const {
    data: overview,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
    error: metricsError,
  } = useQuery({
    queryKey: ["metrics-overview"],
    queryFn: metricsApi.getOverview,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (isMetricsError) {
      const message =
        metricsError instanceof ApiError
          ? metricsError.message
          : "We couldn't load metrics right now.";
      toast({
        title: "Metrics unavailable",
        description: message,
        variant: "destructive",
      });
    }
  }, [isMetricsError, metricsError, toast]);

  const kpiData = useMemo(() => {
    const totals = overview?.totals ?? {};
    return [
      {
        id: "total-screens",
        title: "Total Screens",
        value: isMetricsLoading ? "…" : String(totals.screens ?? totals.total_screens ?? 0),
        subtitle: "Registered devices",
        icon: Monitor,
        trend: { value: "", isPositive: true },
      },
      {
        id: "online-screens",
        title: "Online Screens",
        value: isMetricsLoading ? "…" : String(totals.online_screens ?? totals.online ?? 0),
        subtitle: "Active heartbeat in last 5m",
        icon: Activity,
        variant: "success" as const,
        trend: { value: "", isPositive: true },
      },
      {
        id: "storage",
        title: "Media Storage",
        value: isMetricsLoading ? "…" : `${totals.media_storage_used ?? 0} GB`,
        subtitle: "Used capacity",
        icon: HardDrive,
        variant: "warning" as const,
        trend: { value: "", isPositive: true },
      },
      {
        id: "active-scheduled",
        title: "Active Scheduled",
        value: isMetricsLoading ? "…" : String(totals.active_schedules ?? 0),
        subtitle: "Screens running playlists",
        icon: Calendar,
        trend: { value: "", isPositive: true },
      },
    ];
  }, [overview, isMetricsLoading]);

  const pendingRequests = [
    { id: 1, department: "Marketing", title: "Q1 Campaign Assets", status: "in_review" as const, priority: "High", dueIn: "2 hours" },
    { id: 2, department: "HR", title: "Employee Onboarding Videos", status: "pending" as const, priority: "Medium", dueIn: "1 day" },
    { id: 3, department: "Sales", title: "Product Launch Deck", status: "changes_requested" as const, priority: "High", dueIn: "4 hours" },
    { id: 4, department: "Engineering", title: "Team Updates", status: "approved" as const, priority: "Low", dueIn: "2 days" },
  ];

  const alerts = [
    { id: 1, type: "error" as const, message: "3 screens offline for >24 hours", action: "View Screens" },
    { id: 2, type: "warning" as const, message: "5 media assets expiring in 48 hours", action: "Review Media" },
    { id: 3, type: "info" as const, message: "Storage quota at 48% - consider cleanup", action: "Manage Storage" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your digital signage network
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Report
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <KPICard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.subtitle}
            icon={kpi.icon}
            trend={kpi.trend}
            variant={kpi.variant}
            onClick={() => setSelectedKPI(kpi.id)}
          />
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alerts & Notices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span className="text-sm">{alert.message}</span>
                <Button variant="outline" size="sm">
                  {alert.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests by Department</CardTitle>
            <CardDescription>Requests requiring review or approval</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{request.department}</TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.dueIn}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Running Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Real-time system metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transcode Queue</span>
              <Badge variant="outline" className="border-success text-success">
                0 jobs
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Publish</span>
              <span className="text-sm font-medium">12 minutes ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Failed Tasks (24h)</span>
              <Badge variant="destructive">2</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Operators</span>
              <span className="text-sm font-medium">15 online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Health</span>
              <Badge className="bg-success text-success-foreground">
                All systems operational
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Detail Dialog */}
      <Dialog open={!!selectedKPI} onOpenChange={() => setSelectedKPI(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {kpiData.find(k => k.id === selectedKPI)?.title} Details
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown and metrics
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Detailed view for {selectedKPI} would be displayed here with tables, charts, and drill-down data.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
