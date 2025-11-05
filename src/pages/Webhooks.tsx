import { useState } from "react";
import { Webhook, Send, AlertCircle, CheckCircle, XCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  status: "active" | "inactive";
  createdAt: string;
}

interface DeliveryLog {
  id: string;
  webhookId: string;
  event: string;
  timestamp: string;
  status: "success" | "failed" | "pending";
  statusCode?: number;
  response?: string;
}

const Webhooks = () => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: "1",
      url: "https://api.example.com/webhooks/signhex",
      events: ["screen.online", "screen.offline", "content.approved"],
      status: "active",
      createdAt: "2024-01-15",
    },
  ]);

  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([
    {
      id: "1",
      webhookId: "1",
      event: "screen.online",
      timestamp: "2024-01-20 14:23:15",
      status: "success",
      statusCode: 200,
      response: "OK",
    },
    {
      id: "2",
      webhookId: "1",
      event: "content.approved",
      timestamp: "2024-01-20 13:45:22",
      status: "success",
      statusCode: 200,
      response: "OK",
    },
    {
      id: "3",
      webhookId: "1",
      event: "screen.offline",
      timestamp: "2024-01-20 12:10:05",
      status: "failed",
      statusCode: 500,
      response: "Internal Server Error",
    },
  ]);

  const availableEvents = [
    { id: "screen.online", label: "Screen Comes Online" },
    { id: "screen.offline", label: "Screen Goes Offline" },
    { id: "content.approved", label: "Content Approved" },
    { id: "content.rejected", label: "Content Rejected" },
    { id: "content.published", label: "Content Published" },
    { id: "request.created", label: "Request Created" },
    { id: "request.completed", label: "Request Completed" },
    { id: "department.created", label: "Department Created" },
  ];

  const handleCreateWebhook = () => {
    if (!webhookUrl.trim() || selectedEvents.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a URL and select at least one event.",
        variant: "destructive",
      });
      return;
    }

    const newWebhook: WebhookConfig = {
      id: String(Date.now()),
      url: webhookUrl,
      events: selectedEvents,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setWebhooks([...webhooks, newWebhook]);
    setWebhookUrl("");
    setSelectedEvents([]);
    setIsCreateDialogOpen(false);

    toast({
      title: "Webhook Created",
      description: "Your webhook has been configured successfully.",
    });
  };

  const handleTestWebhook = (webhookId: string) => {
    const testLog: DeliveryLog = {
      id: String(Date.now()),
      webhookId,
      event: "test.event",
      timestamp: new Date().toLocaleString(),
      status: "success",
      statusCode: 200,
      response: "Test successful",
    };

    setDeliveryLogs([testLog, ...deliveryLogs]);

    toast({
      title: "Test Sent",
      description: "Test webhook has been sent successfully.",
    });
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    toast({
      title: "Webhook Deleted",
      description: "The webhook configuration has been removed.",
    });
  };

  const handleRetryDelivery = (logId: string) => {
    setDeliveryLogs(logs => logs.map(log => 
      log.id === logId 
        ? { ...log, status: "pending" as const }
        : log
    ));

    setTimeout(() => {
      setDeliveryLogs(logs => logs.map(log => 
        log.id === logId 
          ? { ...log, status: "success" as const, statusCode: 200, response: "OK" }
          : log
      ));

      toast({
        title: "Retry Successful",
        description: "The webhook was delivered successfully.",
      });
    }, 1500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook Configuration</h1>
          <p className="text-muted-foreground">
            Configure webhooks to receive real-time event notifications
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
              <DialogDescription>
                Configure a webhook endpoint to receive event notifications
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://api.example.com/webhooks"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Event Types</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableEvents.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.id}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEvents([...selectedEvents, event.id]);
                          } else {
                            setSelectedEvents(selectedEvents.filter(e => e !== event.id));
                          }
                        }}
                      />
                      <Label htmlFor={event.id} className="text-sm font-normal cursor-pointer">
                        {event.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWebhook}>Create Webhook</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">
            <Webhook className="mr-2 h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Send className="mr-2 h-4 w-4" />
            Delivery Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Configured Webhooks</CardTitle>
              <CardDescription>
                Manage your webhook endpoints and subscribed events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-mono text-sm">{webhook.url}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 2).map((event) => (
                            <Badge key={event} variant="secondary" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{webhook.events.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={webhook.status === "active" ? "default" : "secondary"}>
                          {webhook.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {webhook.createdAt}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestWebhook(webhook.id)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Logs</CardTitle>
              <CardDescription>
                View webhook delivery history and retry failed deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Status Code</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{log.event}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.timestamp}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="capitalize">{log.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {log.statusCode || "-"}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.response || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.status === "failed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryDelivery(log.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Webhooks;
