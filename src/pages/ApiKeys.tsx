import { useState } from "react";
import { Key, Copy, Trash2, Plus, Eye, EyeOff } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  createdAt: string;
  lastUsed: string | null;
  status: "active" | "revoked";
}

const ApiKeys = () => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: "1",
      name: "Production API Key",
      key: "sk_live_abc123def456ghi789jkl012mno345",
      scopes: ["read:screens", "write:screens", "read:media"],
      createdAt: "2024-01-15",
      lastUsed: "2024-01-20",
      status: "active",
    },
    {
      id: "2",
      name: "Development Key",
      key: "sk_test_xyz987wvu654tsr321qpo098nml765",
      scopes: ["read:screens", "read:media"],
      createdAt: "2024-01-10",
      lastUsed: null,
      status: "active",
    },
  ]);

  const availableScopes = [
    { id: "read:screens", label: "Read Screens" },
    { id: "write:screens", label: "Write Screens" },
    { id: "read:media", label: "Read Media" },
    { id: "write:media", label: "Write Media" },
    { id: "read:departments", label: "Read Departments" },
    { id: "write:departments", label: "Write Departments" },
    { id: "read:reports", label: "Read Reports" },
    { id: "admin", label: "Full Admin Access" },
  ];

  const handleCreateKey = () => {
    if (!keyName.trim() || selectedScopes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a name and select at least one scope.",
        variant: "destructive",
      });
      return;
    }

    const newKey: ApiKey = {
      id: String(Date.now()),
      name: keyName,
      key: `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      scopes: selectedScopes,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: null,
      status: "active",
    };

    setApiKeys([...apiKeys, newKey]);
    setKeyName("");
    setSelectedScopes([]);
    setIsCreateDialogOpen(false);

    toast({
      title: "API Key Created",
      description: "Your new API key has been generated successfully.",
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Copied",
      description: "API key copied to clipboard.",
    });
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.map(k => k.id === id ? { ...k, status: "revoked" as const } : k));
    toast({
      title: "Key Revoked",
      description: "The API key has been revoked and can no longer be used.",
    });
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const maskKey = (key: string) => {
    return `${key.substring(0, 12)}${"•".repeat(20)}${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Key Management</h1>
          <p className="text-muted-foreground">
            Generate and manage API keys for programmatic access
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key with specific permissions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="Production API Key"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Permissions & Scopes</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableScopes.map((scope) => (
                    <div key={scope.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={scope.id}
                        checked={selectedScopes.includes(scope.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedScopes([...selectedScopes, scope.id]);
                          } else {
                            setSelectedScopes(selectedScopes.filter(s => s !== scope.id));
                          }
                        }}
                      />
                      <Label htmlFor={scope.id} className="text-sm font-normal cursor-pointer">
                        {scope.label}
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
              <Button onClick={handleCreateKey}>Generate Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Active API Keys
          </CardTitle>
          <CardDescription>
            Manage your API keys and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {apiKey.scopes.slice(0, 2).map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                      {apiKey.scopes.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{apiKey.scopes.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {apiKey.createdAt}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {apiKey.lastUsed || "Never"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={apiKey.status === "active" ? "default" : "destructive"}
                    >
                      {apiKey.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyKey(apiKey.key)}
                        disabled={apiKey.status === "revoked"}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeKey(apiKey.id)}
                        disabled={apiKey.status === "revoked"}
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
    </div>
  );
};

export default ApiKeys;
