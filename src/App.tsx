import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { GlobalLoader } from "@/components/common/GlobalLoader";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ScheduleQueue from "./pages/ScheduleQueue";
import Departments from "./pages/Departments";
import Conversations from "./pages/Conversations";
import Screens from "./pages/Screens";
import MediaLibrary from "./pages/MediaLibrary";
import Requests from "./pages/Requests";
import Operators from "./pages/Operators";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ApiKeys from "./pages/ApiKeys";
import Webhooks from "./pages/Webhooks";
import SsoConfig from "./pages/SsoConfig";
import ProofOfPlay from "./pages/ProofOfPlay";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes, avoid rapid refetches, and dedupe in-flight requests.
      staleTime: 60_000,
      gcTime: 300_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GlobalLoader />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />

          {/* Protected Routes with Layout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <SidebarProvider defaultOpen>
                <div className="min-h-screen flex w-full bg-background">
                  <AppSidebar />
                  <div className="flex-1 flex flex-col w-full">
                    <AppHeader />
                    <main className="flex-1 p-6 overflow-auto">
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/schedule" element={<ScheduleQueue />} />
                        <Route path="/requests" element={<Requests />} />
                        <Route path="/departments" element={<Departments />} />
                        <Route path="/operators" element={<Operators />} />
                        <Route path="/conversations" element={<Conversations />} />
                        <Route path="/screens" element={<Screens />} />
                        <Route path="/media" element={<MediaLibrary />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/api-keys" element={<ApiKeys />} />
                        <Route path="/webhooks" element={<Webhooks />} />
                        <Route path="/sso-config" element={<SsoConfig />} />
                        <Route path="/proof-of-play" element={<ProofOfPlay />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
