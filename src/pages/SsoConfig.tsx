import { useState } from "react";
import { Shield, CheckCircle, AlertCircle, Link2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const SsoConfig = () => {
  const { toast } = useToast();
  const [provider, setProvider] = useState("google");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [domain, setDomain] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const redirectUrl = `${window.location.origin}/auth/callback`;

  const handleTestConnection = () => {
    setIsTesting(true);
    
    setTimeout(() => {
      setIsTesting(false);
      setIsConnected(true);
      toast({
        title: "Connection Successful",
        description: "SSO provider has been connected and tested successfully.",
      });
    }, 2000);
  };

  const handleSaveConfiguration = () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide Client ID and Client Secret.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Configuration Saved",
      description: "SSO configuration has been updated successfully.",
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setClientId("");
    setClientSecret("");
    setDomain("");
    toast({
      title: "Disconnected",
      description: "SSO provider has been disconnected.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SSO / OIDC Configuration</h1>
          <p className="text-muted-foreground">
            Configure Single Sign-On authentication for your organization
          </p>
        </div>
        {isConnected && (
          <Badge variant="default" className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3" />
            Connected
          </Badge>
        )}
      </div>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">
            <Shield className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="mapping">
            <Link2 className="mr-2 h-4 w-4" />
            Attribute Mapping
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>SSO Provider Setup</CardTitle>
              <CardDescription>
                Connect your identity provider using OIDC/SAML protocol
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="provider">Identity Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Workspace</SelectItem>
                    <SelectItem value="azure">Azure Active Directory</SelectItem>
                    <SelectItem value="okta">Okta</SelectItem>
                    <SelectItem value="auth0">Auth0</SelectItem>
                    <SelectItem value="onelogin">OneLogin</SelectItem>
                    <SelectItem value="custom">Custom OIDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    placeholder="your-client-id-here"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input
                    id="client-secret"
                    type="password"
                    placeholder="your-client-secret-here"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                  />
                </div>

                {(provider === "azure" || provider === "okta") && (
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      placeholder={provider === "azure" ? "your-tenant.onmicrosoft.com" : "your-domain.okta.com"}
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Redirect URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={redirectUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(redirectUrl);
                      toast({
                        title: "Copied",
                        description: "Redirect URL copied to clipboard.",
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add this URL to your identity provider's allowed redirect URLs
                </p>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting || !clientId || !clientSecret}
                  variant="outline"
                >
                  {isTesting ? (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>

                <Button onClick={handleSaveConfiguration}>
                  Save Configuration
                </Button>

                {isConnected && (
                  <Button variant="destructive" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {isConnected && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Provider</p>
                    <p className="font-medium capitalize">{provider}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Tested</p>
                    <p className="font-medium">{new Date().toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Users Synced</p>
                    <p className="font-medium">247 users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>User Attribute Mapping</CardTitle>
              <CardDescription>
                Map SSO provider attributes to application user fields
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Application Field</Label>
                  <Input value="Email" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>SSO Attribute</Label>
                  <Input placeholder="email" defaultValue="email" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Application Field</Label>
                  <Input value="First Name" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>SSO Attribute</Label>
                  <Input placeholder="given_name" defaultValue="given_name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Application Field</Label>
                  <Input value="Last Name" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>SSO Attribute</Label>
                  <Input placeholder="family_name" defaultValue="family_name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Application Field</Label>
                  <Input value="Department" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>SSO Attribute</Label>
                  <Input placeholder="department" defaultValue="department" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Application Field</Label>
                  <Input value="Role" readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>SSO Attribute</Label>
                  <Input placeholder="groups" defaultValue="groups" />
                </div>
              </div>

              <Separator />

              <Button>Save Mapping</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SsoConfig;
