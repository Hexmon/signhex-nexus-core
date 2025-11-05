import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface ScreenHealthDashboardProps {
  screenId: string;
  screenName: string;
}

const uptimeData = [
  { time: "00:00", uptime: 99.8 },
  { time: "04:00", uptime: 99.9 },
  { time: "08:00", uptime: 99.7 },
  { time: "12:00", uptime: 99.8 },
  { time: "16:00", uptime: 99.9 },
  { time: "20:00", uptime: 99.8 },
  { time: "24:00", uptime: 99.9 },
];

const performanceData = [
  { time: "00:00", fps: 60, cpu: 25, memory: 45 },
  { time: "04:00", fps: 60, cpu: 22, memory: 42 },
  { time: "08:00", fps: 59, cpu: 28, memory: 48 },
  { time: "12:00", fps: 60, cpu: 26, memory: 46 },
  { time: "16:00", fps: 60, cpu: 24, memory: 44 },
  { time: "20:00", fps: 59, cpu: 27, memory: 47 },
  { time: "24:00", fps: 60, cpu: 25, memory: 45 },
];

const healthMetrics = {
  overall: 98.5,
  uptime: 99.8,
  fps: 60,
  cpu: 25,
  memory: 45,
  storage: 68,
  network: 95,
  lastError: "None",
  errorCount24h: 0,
  cacheSize: "3.2 GB",
  lastUpdate: "2 minutes ago",
};

export function ScreenHealthDashboard({ screenId, screenName }: ScreenHealthDashboardProps) {
  const getHealthStatus = (score: number) => {
    if (score >= 95) return { label: "Excellent", color: "text-green-600", icon: CheckCircle };
    if (score >= 85) return { label: "Good", color: "text-blue-600", icon: TrendingUp };
    if (score >= 70) return { label: "Fair", color: "text-yellow-600", icon: Activity };
    return { label: "Poor", color: "text-red-600", icon: AlertCircle };
  };

  const healthStatus = getHealthStatus(healthMetrics.overall);
  const HealthIcon = healthStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Health Monitor: {screenName}</h2>
          <p className="text-sm text-muted-foreground">Screen ID: {screenId}</p>
        </div>
        <Badge variant="outline" className={`${healthStatus.color} border-current`}>
          <HealthIcon className="h-3 w-3 mr-1" />
          {healthStatus.label} ({healthMetrics.overall}%)
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Uptime</p>
              <p className="text-xl font-bold">{healthMetrics.uptime}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Cpu className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CPU Usage</p>
              <p className="text-xl font-bold">{healthMetrics.cpu}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <HardDrive className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Memory</p>
              <p className="text-xl font-bold">{healthMetrics.memory}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Wifi className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Network</p>
              <p className="text-xl font-bold">{healthMetrics.network}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uptime Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">24-Hour Uptime</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={uptimeData}>
              <defs>
                <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis domain={[98, 100]} className="text-xs" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="uptime"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorUptime)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="fps"
                stroke="#10b981"
                strokeWidth={2}
                name="FPS"
              />
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="#3b82f6"
                strokeWidth={2}
                name="CPU %"
              />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="#a855f7"
                strokeWidth={2}
                name="Memory %"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Storage Used</span>
              <span className="font-medium">{healthMetrics.storage}%</span>
            </div>
            <Progress value={healthMetrics.storage} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cache Size</span>
              <span className="font-medium">{healthMetrics.cacheSize} / 5 GB</span>
            </div>
            <Progress value={64} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Last Update</p>
              <p className="text-sm font-medium">{healthMetrics.lastUpdate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Errors (24h)</p>
              <p className="text-sm font-medium text-green-600">{healthMetrics.errorCount24h}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Error</p>
              <p className="text-sm font-medium">{healthMetrics.lastError}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
