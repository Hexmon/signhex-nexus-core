import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/apiClient";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ExternalLink,
  Monitor,
  Server,
  ShieldCheck,
} from "lucide-react";
import { observabilityApi } from "@/api/domains/observability";
import { queryKeys } from "@/api/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatPercent,
  formatRelativeTimestamp,
  getMachineRoleLabel,
  getMachineStatusTone,
  getServiceStatusTone,
} from "@/lib/observability";

const openGrafanaLink = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

export default function Observability() {
  const overviewQuery = useQuery({
    queryKey: queryKeys.observabilityOverview,
    queryFn: observabilityApi.getOverview,
    staleTime: 30_000,
  });

  const overview = overviewQuery.data;
  const machines = useMemo(
    () => overview?.machines ?? [],
    [overview?.machines],
  );

  const infrastructureMachines = useMemo(
    () =>
      machines.filter(
        (machine) =>
          machine.role === "backend" ||
          machine.role === "cms" ||
          machine.role === "development",
      ),
    [machines],
  );

  const grafanaPanels = useMemo(
    () =>
      infrastructureMachines
        .filter((machine) => machine.grafana.dashboard_url)
        .map((machine) => ({
          id: machine.id,
          title: getMachineRoleLabel(machine.role),
          url: machine.grafana.dashboard_url!,
        })),
    [infrastructureMachines],
  );

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (overviewQuery.isError || !overview) {
    const errorMessage =
      overviewQuery.error instanceof ApiError
        ? overviewQuery.error.message
        : "The CMS could not load the Prometheus and Grafana summary data for the infrastructure view.";

    return (
      <Card>
        <CardHeader>
          <CardTitle>Observability unavailable</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Observability
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prometheus-backed infrastructure status for the Server and CMS
            machines, with Grafana drill-downs for deeper analysis.
            Screen-specific observability remains in each screen&apos;s details
            modal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={getMachineStatusTone(overview.alerts.status)}
          >
            Alerts {overview.alerts.status}
          </Badge>
          <Badge variant="outline">
            Generated {formatRelativeTimestamp(overview.generated_at)}
          </Badge>
          <Badge variant="outline">Mode {overview.deployment_mode}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Prometheus source</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Backend and Prometheus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Current state source
              </span>
              <span className="font-medium">
                {overview.current_state_source}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Configured player targets
              </span>
              <span className="font-medium">
                {overview.fleet.configured_player_targets ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Reachable player targets
              </span>
              <span className="font-medium">
                {overview.fleet.reachable_players ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Alert posture</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Alertmanager summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium">
                {overview.alerts.available ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Firing alerts</span>
              <span className="font-medium">{overview.alerts.firing}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Highest severity</span>
              <span className="font-medium">
                {overview.alerts.highest_severity}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Grafana access</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-sky-600" />
              Dashboards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Enabled</span>
              <span className="font-medium">
                {overview.grafana.enabled ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Embedded in CMS</span>
              <span className="font-medium">
                {overview.grafana.embed_enabled ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Base path</span>
              <span className="font-medium">{overview.grafana.base_path}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Access model</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              CMS and Grafana
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Server and CMS machine health is summarized natively here from
              backend APIs.
            </p>
            <p>
              Historical charts and dashboard drill-downs open through the
              same-origin Grafana path.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {infrastructureMachines.map((machine) => (
          <Card key={machine.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardDescription>
                    {getMachineRoleLabel(machine.role)}
                  </CardDescription>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    {machine.role === "cms" ? (
                      <Monitor className="h-5 w-5 text-primary" />
                    ) : (
                      <Server className="h-5 w-5 text-primary" />
                    )}
                    {machine.name}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={getMachineStatusTone(machine.status)}
                >
                  {machine.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    Prometheus targets
                  </p>
                  <p className="text-lg font-semibold">
                    {machine.scrape_status.reachable_targets} /{" "}
                    {machine.scrape_status.expected_targets}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    CPU / memory / disk
                  </p>
                  <p className="text-sm font-semibold">
                    {formatPercent(machine.resources.cpu_percent)} ·{" "}
                    {formatPercent(machine.resources.memory_percent)} ·{" "}
                    {formatPercent(machine.resources.disk_percent)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">CPU</p>
                  <p className="text-lg font-semibold">
                    {formatPercent(machine.resources.cpu_percent)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Memory</p>
                  <p className="text-lg font-semibold">
                    {formatPercent(machine.resources.memory_percent)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Disk</p>
                  <p className="text-lg font-semibold">
                    {formatPercent(machine.resources.disk_percent)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Service health</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {machine.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span>{service.label}</span>
                      <span className={getServiceStatusTone(service.status)}>
                        {service.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {machine.grafana.dashboard_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openGrafanaLink(machine.grafana.dashboard_url!)
                    }
                  >
                    Open {getMachineRoleLabel(machine.role)} Dashboard
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Badge variant="outline">No Grafana dashboard linked</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {overview.grafana.enabled &&
      overview.grafana.embed_enabled &&
      grafanaPanels.length > 0 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Grafana panels</h2>
            <p className="text-sm text-muted-foreground">
              Embedded historical views for the Server and CMS machines. Use the
              full dashboard links above for deeper inspection.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {grafanaPanels.map((panel) => (
              <Card key={panel.id} className="overflow-hidden p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <p className="font-medium">{panel.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Embedded through the CMS Grafana proxy path.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openGrafanaLink(panel.url)}
                  >
                    Open full dashboard
                  </Button>
                </div>
                <iframe
                  title={`${panel.title} Grafana dashboard`}
                  src={panel.url}
                  className="h-[420px] w-full border-0"
                  loading="lazy"
                />
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Screen-level observability</CardTitle>
          <CardDescription>
            Per-screen and per-player observability remains in the screen
            details modal so operators can inspect a specific screen without
            leaving the Screens workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Open <span className="font-medium text-foreground">Screens</span>,
          select a screen, then use the{" "}
          <span className="font-medium text-foreground">Observability</span> tab
          in the details modal for player queue, cache, latest metrics, and
          screen-specific Grafana drill-downs.
        </CardContent>
      </Card>
    </div>
  );
}
