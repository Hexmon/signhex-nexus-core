import { useState } from "react";
import { Search, Monitor, Plus, MapPin, Power, Settings, Trash2, Activity, Wifi, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { PairDeviceModal } from "@/components/screens/PairDeviceModal";
import { ScreenHealthDashboard } from "@/components/screens/ScreenHealthDashboard";
import { FrameLayoutEditor } from "@/components/screens/FrameLayoutEditor";
import { BulkActionsBar } from "@/components/screens/BulkActionsBar";
import { Checkbox } from "@/components/ui/checkbox";

type Screen = {
  id: string;
  name: string;
  location: string;
  department: string;
  status: "online" | "offline" | "maintenance";
  resolution: string;
  orientation: "landscape" | "portrait";
  currentContent?: string;
  lastSync: string;
  uptime: string;
};

const mockScreens: Screen[] = [
  {
    id: "SCR-001",
    name: "Main Lobby Display",
    location: "Building A - Lobby",
    department: "Marketing",
    status: "online",
    resolution: "1920x1080",
    orientation: "landscape",
    currentContent: "Black Friday Promo",
    lastSync: "2 min ago",
    uptime: "99.8%"
  },
  {
    id: "SCR-002",
    name: "Cafeteria Menu Board",
    location: "Building A - Cafeteria",
    department: "Food & Beverage",
    status: "online",
    resolution: "1080x1920",
    orientation: "portrait",
    currentContent: "Weekly Menu",
    lastSync: "5 min ago",
    uptime: "99.5%"
  },
  {
    id: "SCR-003",
    name: "Conference Room A",
    location: "Building B - 3rd Floor",
    department: "IT Operations",
    status: "maintenance",
    resolution: "3840x2160",
    orientation: "landscape",
    lastSync: "2 hours ago",
    uptime: "95.2%"
  },
  {
    id: "SCR-004",
    name: "HR Info Display",
    location: "Building A - HR Department",
    department: "HR",
    status: "online",
    resolution: "1920x1080",
    orientation: "landscape",
    currentContent: "Training Schedule",
    lastSync: "1 min ago",
    uptime: "99.9%"
  },
  {
    id: "SCR-005",
    name: "Elevator Lobby",
    location: "Building C - Ground Floor",
    department: "Marketing",
    status: "offline",
    resolution: "1080x1920",
    orientation: "portrait",
    lastSync: "3 days ago",
    uptime: "85.3%"
  },
  {
    id: "SCR-006",
    name: "Reception Desk",
    location: "Building A - Main Entrance",
    department: "Sales",
    status: "online",
    resolution: "1920x1080",
    orientation: "landscape",
    currentContent: "Welcome Message",
    lastSync: "30 sec ago",
    uptime: "99.7%"
  }
];

export default function Screens() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPairDeviceOpen, setIsPairDeviceOpen] = useState(false);
  const [isFrameEditorOpen, setIsFrameEditorOpen] = useState(false);
  const [selectedScreenForHealth, setSelectedScreenForHealth] = useState<{id: string, name: string} | null>(null);
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "health">("grid");

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedScreens(filteredScreens.map(s => s.id));
    } else {
      setSelectedScreens([]);
    }
  };

  const handleSelectScreen = (screenId: string, checked: boolean) => {
    if (checked) {
      setSelectedScreens([...selectedScreens, screenId]);
    } else {
      setSelectedScreens(selectedScreens.filter(id => id !== screenId));
    }
  };

  const filteredScreens = mockScreens.filter(screen => {
    const matchesSearch = search === "" || 
      screen.name.toLowerCase().includes(search.toLowerCase()) ||
      screen.location.toLowerCase().includes(search.toLowerCase()) ||
      screen.department.toLowerCase().includes(search.toLowerCase()) ||
      screen.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = activeTab === "all" || screen.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: mockScreens.length,
    online: mockScreens.filter(s => s.status === "online").length,
    offline: mockScreens.filter(s => s.status === "offline").length,
    maintenance: mockScreens.filter(s => s.status === "maintenance").length,
  };

  if (viewMode === "health" && selectedScreenForHealth) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => {
          setViewMode("grid");
          setSelectedScreenForHealth(null);
        }}>
          ← Back to Screens
        </Button>
        <ScreenHealthDashboard
          screenId={selectedScreenForHealth.id}
          screenName={selectedScreenForHealth.name}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Screens</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor all display screens across locations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPairDeviceOpen(true)}>
            <Wifi className="h-4 w-4 mr-2" />
            Pair Device
          </Button>
          <Button variant="outline" onClick={() => setIsFrameEditorOpen(true)}>
            <LayoutGrid className="h-4 w-4 mr-2" />
            Frame Editor
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Screen
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Screen</DialogTitle>
              <DialogDescription>
                Register a new display screen to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="screen-name">Screen Name</Label>
                <Input id="screen-name" placeholder="e.g., Main Lobby Display" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="e.g., Building A - Lobby" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="it">IT Operations</SelectItem>
                    <SelectItem value="fb">Food & Beverage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution</Label>
                <Select>
                  <SelectTrigger id="resolution">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                    <SelectItem value="3840x2160">3840x2160 (4K)</SelectItem>
                    <SelectItem value="1080x1920">1080x1920 (Portrait HD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select>
                  <SelectTrigger id="orientation">
                    <SelectValue placeholder="Select orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape">Landscape</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>
                Add Screen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Screens</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Power className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Online</p>
              <p className="text-2xl font-bold text-green-600">{stats.online}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Power className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Offline</p>
              <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Settings className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maintenance</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedScreens.length === filteredScreens.length && filteredScreens.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">Select All</span>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search screens by name, location, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="online">Online</TabsTrigger>
              <TabsTrigger value="offline">Offline</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Screens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScreens.map((screen) => (
          <Card key={screen.id} className="p-5 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedScreens.includes(screen.id)}
                    onCheckedChange={(checked) => handleSelectScreen(screen.id, checked as boolean)}
                  />
                  <div className={`p-2 rounded-lg ${
                    screen.status === "online" ? "bg-green-500/10" :
                    screen.status === "offline" ? "bg-red-500/10" :
                    "bg-yellow-500/10"
                  }`}>
                    <Monitor className={`h-5 w-5 ${
                      screen.status === "online" ? "text-green-600" :
                      screen.status === "offline" ? "text-red-600" :
                      "text-yellow-600"
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{screen.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{screen.id}</p>
                  </div>
                </div>
                <StatusBadge status={screen.status} />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{screen.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{screen.department}</Badge>
                  <Badge variant="secondary">{screen.resolution}</Badge>
                  <Badge variant="secondary">{screen.orientation}</Badge>
                </div>
              </div>

              {screen.currentContent && (
                <div className="p-2 bg-accent rounded-md">
                  <p className="text-xs text-muted-foreground">Currently Playing:</p>
                  <p className="text-sm font-medium">{screen.currentContent}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>Uptime: {screen.uptime}</span>
                </div>
                <span>Synced {screen.lastSync}</span>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedScreenForHealth({ id: screen.id, name: screen.name });
                    setViewMode("health");
                  }}
                >
                  <Activity className="h-3 w-3 mr-1" />
                  Health
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Power className="h-3 w-3 mr-1" />
                  Restart
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PairDeviceModal open={isPairDeviceOpen} onOpenChange={setIsPairDeviceOpen} />
      <FrameLayoutEditor open={isFrameEditorOpen} onOpenChange={setIsFrameEditorOpen} />
      <BulkActionsBar
        selectedCount={selectedScreens.length}
        onClearSelection={() => setSelectedScreens([])}
      />
    </div>
  );
}
