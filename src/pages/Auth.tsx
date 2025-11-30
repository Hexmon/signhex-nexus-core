import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/api/domains/auth";
import { ApiError } from "@/api/apiClient";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import { getCookie } from "@/lib/cookies";
import { isValidEmail, isSecurePassword } from "@/lib/validation";
import { STORAGE_KEYS } from "@/lib/constants";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("login-email") ?? "");
    const password = String(formData.get("login-password") ?? "");

    if (!isValidEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Enter a valid email address.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!isSecurePassword(password)) {
      toast({
        title: "Weak password",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const auth = await authApi.login({ email, password });
      const csrfToken = auth.csrf_token ?? getCookie("csrf_token");

      dispatch(setCredentials({ token: auth.token, user: auth.user, csrfToken }));

      toast({
        title: "Login successful",
        description: "Welcome back to Signhex CMS",
      });
      const redirectPath = sessionStorage.getItem(STORAGE_KEYS.postLoginRedirect);
      if (redirectPath) {
        sessionStorage.removeItem(STORAGE_KEYS.postLoginRedirect);
      }
      navigate(redirectPath || "/dashboard");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to login right now.";
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    toast({
      title: "Signup request",
      description: "Self-service signup is disabled. Please ask an admin to invite you.",
    });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Monitor className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Signhex CMS</h1>
          <p className="text-muted-foreground">Enterprise Digital Signage Management</p>
        </div>

        {/* Auth Card */}
        <Card className="border-border shadow-xl">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="space-y-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <CardTitle className="text-2xl">Welcome back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your dashboard
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="login-email"
                      type="email"
                      placeholder="name@company.com"
                      required
                      disabled={isLoading}
                      defaultValue="admin@hexmon.local"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <Button variant="link" size="sm" className="px-0 h-auto">
                        Forgot password?
                      </Button>
                    </div>
                    <Input
                      id="login-password"
                      name="login-password"
                      type="password"
                      required
                      disabled={isLoading}
                      defaultValue="ChangeMe123!"
                    />
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  <CardTitle className="text-2xl">Create account</CardTitle>
                  <CardDescription>
                    Get started with Signhex CMS today
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="signup-name"
                      type="text"
                      placeholder="John Doe"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="signup-email"
                      type="email"
                      placeholder="name@company.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="signup-password"
                      type="password"
                      placeholder="Create a strong password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      name="signup-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
