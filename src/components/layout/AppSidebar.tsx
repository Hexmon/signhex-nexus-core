import type { CSSProperties } from "react";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Building2,
  Users,
  Kanban,
  Monitor,
  FolderOpen,
  FileBarChart,
  Settings,
  HelpCircle,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import signhexLogo from "@/assets/signhex-logo.png";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Schedule Queue", url: "/schedule", icon: Calendar },
  { title: "Requests", url: "/requests", icon: MessageSquare },
  { title: "Departments", url: "/departments", icon: Building2 },
  { title: "Operators", url: "/operators", icon: Users },
  { title: "Conversations", url: "/conversations", icon: Kanban },
  { title: "Screens", url: "/screens", icon: Monitor },
  { title: "Media Library", url: "/media", icon: FolderOpen },
  { title: "Reports & Logs", url: "/reports", icon: FileBarChart },
  { title: "Site Settings", url: "/settings", icon: Settings },
];

const sidebarTheme: CSSProperties = {
  // Force a light shell with dark text, even if the rest of the app theme changes.
  "--sidebar-background": "0 0% 100%",
  "--sidebar-foreground": "217 33% 17%",
  "--sidebar-accent": "0 34% 95%",
  "--sidebar-accent-foreground": "0 100% 25%",
};

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground" style={sidebarTheme}>
      <SidebarContent>
        <div className={`flex items-center px-4 py-6 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <img 
            src={signhexLogo} 
            alt="Signhex" 
            className={`${isCollapsed ? 'h-8 w-8' : 'h-10 w-10'} object-contain`}
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-primary">Signhex</span>
              <span className="text-xs text-muted-foreground">Super Admin</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-foreground font-semibold hover:bg-sidebar-accent"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Help & Documentation">
                  <a href="#" className="text-muted-foreground">
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Docs</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
