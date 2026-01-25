import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Calendar, HardDrive, Monitor, Plus } from "lucide-react";
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
import { reportsApi } from "@/api/domains/reports";
import { healthApi } from "@/api/domains/health";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const formatBytes = (bytes?: number | null) => {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
};

const formatPercent = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `${Math.round(value)}%`;
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
};

const normalizeHealthStatus = (status?: string) => (status || "unknown").toLowerCase();

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

export default function Dashboard() {
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
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

  const {
    data: apiHealth,
    isLoading: isHealthLoading,
    isError: isHealthError,
    error: healthError,
  } = useQuery({
    queryKey: ["health"],
    queryFn: healthApi.get,
    staleTime: 30_000,
  });

  const {
    data: requestsByDept,
    isLoading: isRequestsLoading,
    isError: isRequestsError,
    error: requestsError,
  } = useQuery({
    queryKey: ["reports-requests-by-department"],
    queryFn: reportsApi.getRequestsByDepartment,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const {
    data: offlineScreens,
    isLoading: isOfflineLoading,
    isError: isOfflineError,
    error: offlineError,
  } = useQuery({
    queryKey: ["reports-offline-screens"],
    queryFn: reportsApi.getOfflineScreens,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const {
    data: storageReport,
    isLoading: isStorageLoading,
    isError: isStorageError,
    error: storageError,
  } = useQuery({
    queryKey: ["reports-storage"],
    queryFn: reportsApi.getStorageReport,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const {
    data: systemHealth,
    isLoading: isSystemHealthLoading,
    isError: isSystemHealthError,
    error: systemHealthError,
  } = useQuery({
    queryKey: ["reports-system-health"],
    queryFn: reportsApi.getSystemHealth,
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

  useEffect(() => {
    if (isRequestsError) {
      toast({
        title: "Requests unavailable",
        description: getErrorMessage(requestsError, "We couldn't load requests right now."),
        variant: "destructive",
      });
    }
  }, [isRequestsError, requestsError, toast]);

  useEffect(() => {
    if (isOfflineError) {
      toast({
        title: "Offline screens unavailable",
        description: getErrorMessage(offlineError, "We couldn't load offline screens."),
        variant: "destructive",
      });
    }
  }, [isOfflineError, offlineError, toast]);

  useEffect(() => {
    if (isStorageError) {
      toast({
        title: "Storage report unavailable",
        description: getErrorMessage(storageError, "We couldn't load storage usage."),
        variant: "destructive",
      });
    }
  }, [isStorageError, storageError, toast]);

  useEffect(() => {
    if (isSystemHealthError) {
      toast({
        title: "System health unavailable",
        description: getErrorMessage(systemHealthError, "We couldn't load system health."),
        variant: "destructive",
      });
    }
  }, [isSystemHealthError, systemHealthError, toast]);

  useEffect(() => {
    if (isHealthError) {
      toast({
        title: "API health check failed",
        description: getErrorMessage(healthError, "Unable to reach the API health endpoint."),
        variant: "destructive",
      });
    }
  }, [isHealthError, healthError, toast]);

  const totalsMetrics = useMemo(() => overview?.totals ?? {}, [overview]);
  const screensMetrics = useMemo(() => overview?.screens ?? {}, [overview]);
  const storageBytes = overview?.storage?.media_bytes ?? storageReport?.storage?.media_bytes;
  const quotaBytes = storageReport?.storage?.quota_bytes ?? null;
  const quotaPercent =
    storageReport?.storage?.quota_percent ??
    (quotaBytes && storageBytes ? (storageBytes / quotaBytes) * 100 : null);
  const apiHealthStatus = apiHealth?.status ?? overview?.system_health?.status ?? "unknown";
  const apiStatusNormalized = normalizeHealthStatus(apiHealthStatus);
  const isApiHealthy = ["ok", "healthy", "pass", "operational", "up"].includes(apiStatusNormalized);
  const apiHealthClass =
    apiStatusNormalized === "unknown"
      ? "bg-secondary text-secondary-foreground"
      : isApiHealthy
        ? "bg-success text-success-foreground"
        : "bg-destructive text-destructive-foreground";
  const pendingJobs = systemHealth?.transcode_queue?.pending ?? 0;
  const failedTasks = systemHealth?.jobs?.failed_last_24h ?? 0;
  const lastPublishAt = systemHealth?.publishes?.last_published_at;
  const activeOperators = systemHealth?.operators?.active;
  const heartbeats5m = overview?.system_health?.heartbeats?.last_5m ?? screensMetrics.online_last_5m;
  const heartbeats1h = overview?.system_health?.heartbeats?.last_1h;
  const lastHeartbeatAt = overview?.system_health?.last_heartbeat_at;

  const kpiData = useMemo(() => {
    const storageTrend =
      quotaPercent !== null && quotaPercent !== undefined
        ? `${formatPercent(quotaPercent)} used`
        : undefined;

    return [
      {
        id: "total-screens",
        title: "Total Screens",
        value: isMetricsLoading ? "…" : String(totalsMetrics.screens ?? screensMetrics.total ?? 0),
        subtitle: "Registered devices",
        icon: Monitor,
      },
      {
        id: "online-screens",
        title: "Online Screens",
        value: isMetricsLoading ? "…" : String(screensMetrics.online_last_5m ?? screensMetrics.online ?? 0),
        subtitle: "Active heartbeat in last 5m",
        icon: Activity,
        variant: "success" as const,
      },
      {
        id: "storage",
        title: "Media Storage",
        value: isMetricsLoading ? "…" : formatBytes(storageBytes),
        subtitle: quotaBytes ? `of ${formatBytes(quotaBytes)}` : "Used capacity",
        icon: HardDrive,
        variant: "warning" as const,
        trend: storageTrend
          ? { value: storageTrend, isPositive: (quotaPercent ?? 0) < 85 }
          : undefined,
      },
      {
        id: "active-scheduled",
        title: "Active Scheduled",
        value: isMetricsLoading ? "…" : String(overview?.schedules?.active ?? 0),
        subtitle: "Screens running playlists",
        icon: Calendar,
      },
    ];
  }, [isMetricsLoading, quotaPercent, quotaBytes, storageBytes, screensMetrics, totalsMetrics, overview?.schedules?.active]);

  const departmentRequests = useMemo(() => {
    if (Array.isArray(requestsByDept)) return requestsByDept;
    if (requestsByDept && Array.isArray((requestsByDept as { departments?: unknown })?.departments)) {
      return (requestsByDept as { departments: typeof requestsByDept })?.departments ?? [];
    }
    return [];
  }, [requestsByDept]);

  const pendingRequests = useMemo(() => {
    if (!departmentRequests) return [];

    return departmentRequests
      .filter((dept) => (dept?.requests?.length ?? 0) > 0)
      .map((dept) => {
        const sorted = [...dept.requests].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        const latest = sorted[0];
        return {
          id: dept.department_id || dept.department_name || "unknown",
          department: dept.department_name || "Unassigned",
          count: dept.requests.length,
          latestTitle: latest?.title ?? "—",
          status: latest?.status,
          createdAt: latest?.created_at,
        };
      });
  }, [departmentRequests]);

  const alerts = useMemo(() => {
    const items: Array<{
      id: string;
      type: "error" | "warning";
      message: string;
      action: string;
      onClick: () => void;
    }> = [];

    const offlineCount = offlineScreens?.count ?? 0;
    if (offlineCount > 0) {
      items.push({
        id: "offline",
        type: "error",
        message: `${offlineCount} screen${offlineCount === 1 ? "" : "s"} offline for >24 hours`,
        action: "View screens",
        onClick: () => navigate("/screens"),
      });
    }

    if (quotaPercent !== null && quotaPercent !== undefined && quotaPercent >= 80) {
      items.push({
        id: "storage",
        type: "warning",
        message: `Storage at ${formatPercent(quotaPercent)} of quota`,
        action: "Manage storage",
        onClick: () => navigate("/media"),
      });
    }

    return items;
  }, [offlineScreens, quotaPercent, navigate]);

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
          <Button variant="default" onClick={() => navigate("/schedule/new")}>
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
      {(alerts.length > 0 || isOfflineLoading || isStorageLoading) && (
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alerts & Notices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(isOfflineLoading || isStorageLoading) && alerts.length === 0 ? (
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span className="text-sm text-muted-foreground">Checking for alerts...</span>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg"
                >
                  <span className="text-sm">{alert.message}</span>
                  <Button variant="outline" size="sm" onClick={alert.onClick}>
                    {alert.action}
                  </Button>
                </div>
              ))
            )}
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
                  <TableHead>Open Requests</TableHead>
                  <TableHead>Latest Request</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isRequestsLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Loading requests...
                    </TableCell>
                  </TableRow>
                )}

                {!isRequestsLoading && pendingRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No pending requests right now.
                    </TableCell>
                  </TableRow>
                )}

                {!isRequestsLoading &&
                  pendingRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate("/requests")}
                    >
                      <TableCell className="font-medium">{request.department}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.count}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">{request.latestTitle}</TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(request.createdAt)}
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
              <Badge
                variant="outline"
                className={
                  pendingJobs > 0 ? "border-warning text-warning" : "border-success text-success"
                }
              >
                {isSystemHealthLoading
                  ? "Loading..."
                  : `${pendingJobs} job${pendingJobs === 1 ? "" : "s"}`}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Publish</span>
              <span className="text-sm font-medium">
                {isSystemHealthLoading ? "Loading..." : formatRelativeTime(lastPublishAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Failed Tasks (24h)</span>
              <Badge
                variant={failedTasks > 0 ? "destructive" : "outline"}
                className={failedTasks > 0 ? "" : "border-success text-success"}
              >
                {isSystemHealthLoading ? "Loading..." : failedTasks}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Operators</span>
              <span className="text-sm font-medium">
                {isSystemHealthLoading ? "Loading..." : activeOperators ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Health</span>
              <Badge
                className={apiHealthClass}
              >
                {isHealthLoading ? "Checking..." : apiHealthStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Heartbeats (5m / 1h)</span>
              <span className="text-sm font-medium">
                {isMetricsLoading
                  ? "Loading..."
                  : `${heartbeats5m ?? 0} / ${heartbeats1h ?? "—"}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Heartbeat</span>
              <span className="text-sm font-medium">
                {isMetricsLoading ? "Loading..." : formatRelativeTime(lastHeartbeatAt)}
              </span>
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
