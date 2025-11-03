import { X, FileText, Image as ImageIcon, Calendar, Monitor, MessageSquare, CheckCircle2, XCircle, Clock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ContentTypeBadge } from "@/components/dashboard/ContentTypeBadge";

interface Request {
  id: string;
  title: string;
  department: string;
  owner: string;
  status: string;
  priority: string;
  mediaCount: number;
  duration: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  conflictCount: number;
  targetScreens: number;
  createdAt: string;
}

interface RequestDetailDrawerProps {
  request: Request;
  onClose: () => void;
}

export function RequestDetailDrawer({ request, onClose }: RequestDetailDrawerProps) {
  return (
    <div className="w-[480px] border-l border-border bg-background flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1">{request.title}</h2>
            <p className="text-sm text-muted-foreground">{request.id}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <XCircle className="h-4 w-4 mr-2" />
            Request Changes
          </Button>
          <Button size="sm" variant="default">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve & Publish
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5 px-6">
          <TabsTrigger value="summary">
            <FileText className="h-4 w-4 mr-1" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="media">
            <ImageIcon className="h-4 w-4 mr-1" />
            Media
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-1" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="screens">
            <Monitor className="h-4 w-4 mr-1" />
            Screens
          </TabsTrigger>
          <TabsTrigger value="activity">
            <MessageSquare className="h-4 w-4 mr-1" />
            Activity
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Summary Tab */}
          <TabsContent value="summary" className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{request.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-medium">{request.owner}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge variant="secondary" className="mt-1">
                      {request.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{request.createdAt}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Conflict Policy</p>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p className="font-medium mb-1">Priority-based (Default)</p>
                    <p className="text-muted-foreground text-xs">
                      Higher priority content takes precedence. In case of tie, latest published wins.
                      {request.conflictCount > 0 && (
                        <span className="block mt-2 text-destructive font-medium">
                          ⚠️ {request.conflictCount} scheduling conflict(s) detected
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Cache Mode</p>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <p className="text-sm font-medium">Enable Offline Cache</p>
                      <p className="text-xs text-muted-foreground">
                        Content plays offline until expiry
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approval Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm">Department Review</span>
                    </div>
                    <Badge variant="secondary" className="text-success">Approved</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <span className="text-sm">Operator Assignment</span>
                    </div>
                    <Badge variant="secondary" className="text-warning">Pending</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Admin Approval</span>
                    </div>
                    <Badge variant="secondary">Awaiting</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Playlist Items ({request.mediaCount})</h3>
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Add Media
              </Button>
            </div>

            <div className="space-y-3">
              {[
                { name: "welcome_banner.png", type: "image", duration: "00:15" },
                { name: "product_video.mp4", type: "video", duration: "01:30" },
                { name: "pricing_slide.pdf", type: "pdf", duration: "00:20" },
                { name: "testimonials.mp4", type: "video", duration: "00:40" },
              ].map((media, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{media.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <ContentTypeBadge type={media.type as any} />
                          <span className="text-xs text-muted-foreground">Duration: {media.duration}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="p-4 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Total Playlist Duration</p>
              <p className="text-2xl font-bold text-primary">{request.duration}</p>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="p-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scheduling Window</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Start Date & Time</Label>
                  <p className="font-medium mt-1">{request.scheduledStart || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">End Date & Time</Label>
                  <p className="font-medium mt-1">{request.scheduledEnd || "Not set"}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-sm text-muted-foreground">Timezone</Label>
                  <p className="font-medium mt-1">Asia/Kolkata (IST)</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Recurrence</Label>
                  <p className="font-medium mt-1">None (One-time)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Canary Deployment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable Canary</Label>
                    <p className="text-xs text-muted-foreground">Test on subset before full rollout</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Screens Tab */}
          <TabsContent value="screens" className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Target Screens ({request.targetScreens})</h3>
              <Button size="sm" variant="outline">Select Screens</Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[9/16] bg-muted rounded-lg p-4 flex flex-col items-center justify-center border-2 border-primary/20">
                  <Monitor className="h-8 w-8 text-primary mb-2" />
                  <p className="text-xs font-medium">Screen {i + 1}</p>
                  <p className="text-xs text-muted-foreground">Marketing</p>
                  <Badge variant="secondary" className="mt-2 text-xs">Online</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="p-6 space-y-4">
            <div className="space-y-4">
              {[
                { user: "Admin", action: "Moved to In Review", time: "2 hours ago" },
                { user: "Priya Sharma", action: "Updated media playlist", time: "5 hours ago" },
                { user: "Dept Manager", action: "Approved request", time: "1 day ago" },
                { user: "Priya Sharma", action: "Created request", time: "3 days ago" },
              ].map((activity, index) => (
                <div key={index} className="flex gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {activity.user[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
