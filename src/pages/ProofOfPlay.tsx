import { useState } from "react";
import { FileBarChart, Download, Calendar, Filter, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface PlayLog {
  id: string;
  screenName: string;
  contentTitle: string;
  department: string;
  playedAt: string;
  duration: number;
  status: "completed" | "interrupted" | "skipped";
}

const ProofOfPlay = () => {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState("2024-01-01");
  const [dateTo, setDateTo] = useState("2024-01-31");
  const [selectedScreen, setSelectedScreen] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedContent, setSelectedContent] = useState("all");

  const [playLogs] = useState<PlayLog[]>([
    {
      id: "1",
      screenName: "Lobby Display 01",
      contentTitle: "January Promotions",
      department: "Marketing",
      playedAt: "2024-01-20 14:23:15",
      duration: 45,
      status: "completed",
    },
    {
      id: "2",
      screenName: "Cafeteria Screen",
      contentTitle: "Safety Training Video",
      department: "HR",
      playedAt: "2024-01-20 13:45:22",
      duration: 180,
      status: "completed",
    },
    {
      id: "3",
      screenName: "Reception Display",
      contentTitle: "Company News",
      department: "Communications",
      playedAt: "2024-01-20 12:10:05",
      duration: 60,
      status: "interrupted",
    },
    {
      id: "4",
      screenName: "Conference Room A",
      contentTitle: "Product Launch",
      department: "Marketing",
      playedAt: "2024-01-20 11:30:45",
      duration: 120,
      status: "completed",
    },
    {
      id: "5",
      screenName: "Lobby Display 02",
      contentTitle: "Emergency Alert",
      department: "Operations",
      playedAt: "2024-01-20 10:15:00",
      duration: 15,
      status: "completed",
    },
  ]);

  const handleExportCSV = () => {
    const headers = ["Screen", "Content", "Department", "Played At", "Duration (s)", "Status"];
    const rows = playLogs.map(log => [
      log.screenName,
      log.contentTitle,
      log.department,
      log.playedAt,
      log.duration,
      log.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proof-of-play-${dateFrom}-to-${dateTo}.csv`;
    a.click();

    toast({
      title: "Export Successful",
      description: "Proof of play report has been downloaded.",
    });
  };

  const handleExportPDF = () => {
    toast({
      title: "PDF Export",
      description: "Generating PDF report...",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "interrupted":
        return "secondary";
      case "skipped":
        return "outline";
      default:
        return "secondary";
    }
  };

  const totalPlays = playLogs.length;
  const totalDuration = playLogs.reduce((sum, log) => sum + log.duration, 0);
  const completedPlays = playLogs.filter(log => log.status === "completed").length;
  const completionRate = ((completedPlays / totalPlays) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proof of Play Reports</h1>
          <p className="text-muted-foreground">
            Detailed playback logs and compliance reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Plays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlays}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalDuration / 60)}m</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalDuration} seconds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedPlays} of {totalPlays} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Screens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(playLogs.map(l => l.screenName)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique displays
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter playback logs by date, screen, department, or content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="screen">Screen</Label>
              <Select value={selectedScreen} onValueChange={setSelectedScreen}>
                <SelectTrigger id="screen">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Screens</SelectItem>
                  <SelectItem value="lobby-01">Lobby Display 01</SelectItem>
                  <SelectItem value="cafeteria">Cafeteria Screen</SelectItem>
                  <SelectItem value="reception">Reception Display</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger id="department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Select value={selectedContent} onValueChange={setSelectedContent}>
                <SelectTrigger id="content">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="promotions">Promotions</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Playback Logs
          </CardTitle>
          <CardDescription>
            Detailed record of all content playback events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Screen</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Played At</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.screenName}</TableCell>
                  <TableCell>{log.contentTitle}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.department}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.playedAt}
                  </TableCell>
                  <TableCell>{log.duration}s</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(log.status)}>
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProofOfPlay;
