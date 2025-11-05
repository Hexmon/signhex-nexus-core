import { useState } from "react";
import { Download, Filter, Calendar, TrendingUp, Activity, Users, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "warning" | "error" | "success";
  user: string;
  action: string;
  details: string;
}

const mockLogs: LogEntry[] = [
  {
    id: "LOG-001",
    timestamp: "2024-03-15T14:30:00",
    type: "success",
    user: "John Smith",
    action: "Content Upload",
    details: "Uploaded promotional video to Marketing department",
  },
  {
    id: "LOG-002",
    timestamp: "2024-03-15T14:15:00",
    type: "info",
    user: "Sarah Johnson",
    action: "Schedule Update",
    details: "Modified schedule for Screen SCR-003",
  },
  {
    id: "LOG-003",
    timestamp: "2024-03-15T13:45:00",
    type: "warning",
    user: "Michael Chen",
    action: "Screen Offline",
    details: "Screen SCR-007 went offline - connection timeout",
  },
  {
    id: "LOG-004",
    timestamp: "2024-03-15T13:30:00",
    type: "error",
    user: "System",
    action: "Playback Error",
    details: "Failed to play video file on Screen SCR-005",
  },
  {
    id: "LOG-005",
    timestamp: "2024-03-15T12:00:00",
    type: "success",
    user: "Emma Wilson",
    action: "User Created",
    details: "New operator David Miller added to IT department",
  },
];

const Reports = () => {
  const [dateRange, setDateRange] = useState("7days");
  const [logFilter, setLogFilter] = useState("all");

  const filteredLogs = mockLogs.filter((log) => {
    if (logFilter === "all") return true;
    return log.type === logFilter;
  });

  const getLogBadge = (type: string) => {
    const variants = {
      info: "bg-blue-100 text-blue-800 border-blue-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      error: "bg-red-100 text-red-800 border-red-200",
      success: "bg-green-100 text-green-800 border-green-200",
    };

    return (
      <Badge variant="outline" className={variants[type as keyof typeof variants]}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Logs</h1>
          <p className="text-muted-foreground">
            View analytics, system activity, and download reports
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Screens</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42/45</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">93.3%</span> uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">+2</span> new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.2%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3.1%</span> from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="content">Content Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Activity Logs</CardTitle>
                  <CardDescription>Recent system events and user actions</CardDescription>
                </div>
                <Select value={logFilter} onValueChange={setLogFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Logs</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warnings</SelectItem>
                    <SelectItem value="error">Errors</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {getLogBadge(log.type)}
                        <span className="font-semibold">{log.action}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>User: {log.user}</span>
                        <span>•</span>
                        <span>
                          {new Date(log.timestamp).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Screen Uptime</CardTitle>
                <CardDescription>Average uptime across all screens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Overall Uptime</span>
                    <span className="text-sm font-semibold">93.3%</span>
                  </div>
                  <Progress value={93.3} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Content Delivery Success</span>
                    <span className="text-sm font-semibold">97.8%</span>
                  </div>
                  <Progress value={97.8} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Network Reliability</span>
                    <span className="text-sm font-semibold">95.5%</span>
                  </div>
                  <Progress value={95.5} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
                <CardDescription>Top performing content types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Video Content</span>
                    <span className="text-sm font-semibold">78%</span>
                  </div>
                  <Progress value={78} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Image Slideshows</span>
                    <span className="text-sm font-semibold">65%</span>
                  </div>
                  <Progress value={65} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Text Announcements</span>
                    <span className="text-sm font-semibold">52%</span>
                  </div>
                  <Progress value={52} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Analytics</CardTitle>
              <CardDescription>
                Detailed analytics and insights for your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Content analytics dashboard coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
