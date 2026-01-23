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
  PanelsTopLeft
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
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Media Library", url: "/media", icon: FolderOpen },
  { title: "Layouts", url: "/layouts", icon: PanelsTopLeft },
  { title: "Screens", url: "/screens", icon: Monitor },
  { title: "Schedule Queue", url: "/schedule", icon: Calendar },
  // { title: "Requests", url: "/requests", icon: MessageSquare },
  { title: "Conversations", url: "/conversations", icon: Kanban },
  { title: "Operators", url: "/operators", icon: Users },
  { title: "Departments", url: "/departments", icon: Building2 },
  { title: "Users", url: "/users", icon: Users },
  { title: "Reports & Logs", url: "/reports", icon: FileBarChart },
  { title: "Site Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
      <SidebarContent>
        <div className={`flex items-center px-4 py-6 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <img 
            src={signhexLogo} 
            alt="Signhex" 
            className={`${isCollapsed ? 'h-8 w-8' : 'h-10 w-10'} object-contain`}
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span
                className="font-bold text-lg"
                style={{ color: "hsl(var(--sidebar-primary))" }}
              >
                Signhex
              </span>
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
                        cn(
                          "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-200",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/70",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              "h-6 w-1 rounded-full bg-sidebar-foreground transition-all duration-200",
                              isActive ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </>
                      )}
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
