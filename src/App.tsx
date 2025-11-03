import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider defaultOpen>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col w-full">
              <AppHeader />
              <main className="flex-1 p-6 overflow-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/schedule" element={<div className="text-2xl font-semibold">Schedule Queue (Coming Soon)</div>} />
                  <Route path="/requests" element={<div className="text-2xl font-semibold">Requests (Coming Soon)</div>} />
                  <Route path="/departments" element={<div className="text-2xl font-semibold">Departments (Coming Soon)</div>} />
                  <Route path="/operators" element={<div className="text-2xl font-semibold">Operators (Coming Soon)</div>} />
                  <Route path="/conversations" element={<div className="text-2xl font-semibold">Conversations (Coming Soon)</div>} />
                  <Route path="/screens" element={<div className="text-2xl font-semibold">Screens (Coming Soon)</div>} />
                  <Route path="/media" element={<div className="text-2xl font-semibold">Media Library (Coming Soon)</div>} />
                  <Route path="/reports" element={<div className="text-2xl font-semibold">Reports & Logs (Coming Soon)</div>} />
                  <Route path="/settings" element={<div className="text-2xl font-semibold">Site Settings (Coming Soon)</div>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
