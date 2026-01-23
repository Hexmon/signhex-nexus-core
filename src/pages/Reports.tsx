import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, TrendingUp, Activity, Users, Monitor, AlertTriangle, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { reportsApi } from "@/api/domains/reports";
import { proofOfPlayApi } from "@/api/domains/proofOfPlay";
import { auditLogsApi } from "@/api/domains/auditLogs";
import { notificationsApi } from "@/api/domains/notifications";
import { emergencyApi } from "@/api/domains/emergency";
import { ApiError } from "@/api/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuthorization } from "@/hooks/useAuthorization";
import type { PaginatedResponse, ProofOfPlay } from "@/api/types";

export default function Reports() {
  const { toast } = useToast();
  const [resourceFilter, setResourceFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const debouncedResource = useDebounce(resourceFilter, 400);
  const debouncedAction = useDebounce(actionFilter, 400);
  const { can, isLoading: isAuthzLoading } = useAuthorization();

  const canReadReports = can("read", "Report");
  const canReadAuditLogs = can("read", "AuditLog");

  const summaryQuery = useQuery({
    queryKey: ["reports-summary"],
    queryFn: reportsApi.getSummary,
    enabled: canReadReports,
  });

  const popQuery = useQuery({
    queryKey: ["pop-list"],
    queryFn: () => proofOfPlayApi.list({ limit: 10, page: 1 }),
    enabled: canReadReports,
  });

  const auditLogsQuery = useQuery({
    queryKey: ["audit-logs", debouncedResource, debouncedAction],
    queryFn: () =>
      auditLogsApi.list({
        page: 1,
        limit: 10,
        resource_type: debouncedResource || undefined,
        action: debouncedAction || undefined,
      }),
    enabled: canReadAuditLogs,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "latest"],
    queryFn: () => notificationsApi.list({ page: 1, limit: 5 }),
    enabled: canReadReports,
  });

  const emergencyQuery = useQuery({
    queryKey: ["emergency-status"],
    queryFn: emergencyApi.status,
    refetchInterval: 30_000,
    enabled: canReadReports,
  });

  useEffect(() => {
    const err =
      (canReadReports && (summaryQuery.error || popQuery.error || notificationsQuery.error || emergencyQuery.error)) ||
      (canReadAuditLogs && auditLogsQuery.error);
    if (err) {
      const message = err instanceof ApiError ? err.message : "Unable to load reports.";
      toast({ title: "Load failed", description: message, variant: "destructive" });
    }
  }, [
    canReadReports,
    canReadAuditLogs,
    summaryQuery.error,
    popQuery.error,
    auditLogsQuery.error,
    notificationsQuery.error,
    emergencyQuery.error,
    toast,
  ]);

  const summary = summaryQuery.data;
  const popItems = (popQuery.data as PaginatedResponse<ProofOfPlay> | undefined)?.items ?? [];
  const auditLogs = auditLogsQuery.data?.items ?? [];
  const notifications = notificationsQuery.data?.items ?? [];
  const emergencyStatus = emergencyQuery.data;

  const showAccessDenied = !isAuthzLoading && !canReadReports && !canReadAuditLogs;

  const auditPlaceholder = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      )),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Logs</h1>
          <p className="text-muted-foreground">View KPIs and recent proof-of-play records.</p>
        </div>
        {canReadReports && (
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {showAccessDenied && (
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>You do not have permission to view reports or audit logs.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {canReadAuditLogs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Logs
            </CardTitle>
            <CardDescription>Filter by resource or action to reduce noise.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Filter by resource type (e.g., screen, schedule)"
                className="max-w-xs"
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
              />
              <Input
                placeholder="Filter by action (e.g., UPDATE, DELETE)"
                className="max-w-xs"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              />
            </div>
            <div className="divide-y rounded-md border">
              {auditLogsQuery.isLoading
                ? auditPlaceholder
                : auditLogs.map((log) => (
                    <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{log.action ?? "ACTION"}</span>
                        <span className="text-xs text-muted-foreground">
                          {log.resource_type ?? "resource"} — {log.user_id ?? "system"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.created_at ?? ""}</span>
                    </div>
                  ))}
              {!auditLogsQuery.isLoading && auditLogs.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">No logs found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {canReadReports && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Latest Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notificationsQuery.isLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              )}
              {!notificationsQuery.isLoading && notifications.length === 0 && (
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
              )}
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium text-sm">{n.title ?? "Notification"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.body ?? ""}</p>
                  </div>
                  {!n.read && <Badge variant="secondary">New</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Emergency Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {emergencyQuery.isLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">{emergencyStatus?.status ?? "UNKNOWN"}</p>
                    <p className="text-xs text-muted-foreground">
                      {emergencyStatus?.triggered_at ? `Since ${emergencyStatus.triggered_at}` : "No active incident"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      emergencyStatus?.id
                        ? emergencyApi.clear(emergencyStatus.id).then(() => emergencyQuery.refetch())
                        : emergencyApi.trigger({ message: "Manual trigger" }).then(() => emergencyQuery.refetch())
                    }
                  >
                    {emergencyStatus?.status === "ACTIVE" ? "Clear" : "Trigger"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {canReadReports && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Media</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryQuery.isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{summary?.media_total ?? 0}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryQuery.isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{summary?.requests_open ?? 0}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Screens</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryQuery.isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{summary?.screens_active ?? 0}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {summaryQuery.isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{summary?.requests_completed ?? 0}</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Proof-of-Play</CardTitle>
              <CardDescription>Latest playbacks reported by devices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {popQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => <Skeleton key={idx} className="h-10" />)
              ) : popItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No proof-of-play events recorded yet.</p>
              ) : (
                popItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 text-sm"
                  >
                    <div>
                      <div className="font-semibold">Media: {item.media_id}</div>
                      <div className="text-muted-foreground text-xs">
                        Screen: {item.screen_id} · {new Date(item.played_at).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="outline">Played</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
