import { NavLink, useLocation } from "react-router-dom";
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
import {
  LayoutDashboard,
  Users,
  Building2,
  Pill,
  Upload,
  FileText,
  AlertTriangle,
  BarChart3,
  UserCheck,
  Store,
} from "lucide-react";

const navigationItems = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Notifications", url: "/notifications", icon: AlertTriangle },
    ]
  },
  {
    title: "Patient Management",
    items: [
      { title: "Patient Database", url: "/patients", icon: Users },
      { title: "Patient Search", url: "/patients/search", icon: UserCheck },
    ]
  },
  {
    title: "Data Management",
    items: [
      { title: "Upload Clinic Data", url: "/upload/clinic", icon: Upload },
      { title: "Upload Vendor Reports", url: "/upload/vendor", icon: Building2 },
      { title: "Upload Pharmacy Data", url: "/upload/pharmacy", icon: Pill },
    ]
  },
  {
    title: "Vendors",
    items: [
      { title: "Manage Vendors", url: "/vendors", icon: Store },
      { title: "Vendor Reports", url: "/vendors/reports", icon: FileText },
    ]
  },
  {
    title: "Clinics",
    items: [
      { title: "Manage Clinics", url: "/clinics", icon: Building2 },
    ]
  },
  {
    title: "Reports & Analytics",
    items: [
      { title: "All Reports", url: "/reports", icon: BarChart3 },
      { title: "Reconciliation", url: "/reports/reconciliation", icon: FileText },
      { title: "Non-Ordering", url: "/reports/non-ordering", icon: FileText },
      { title: "Business Trending", url: "/reports/trending", icon: FileText },
    ]
  },
  {
    title: "System",
    items: [
      { title: "Exception Handling", url: "/exceptions", icon: AlertTriangle },
    ]
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-primary text-primary-foreground font-medium hover:bg-primary-hover" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r">
        {/* Logo/Brand */}
        <div className="p-4 border-b">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Pill className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">MediCann Admin</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <Pill className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation Groups */}
        {navigationItems.map((group) => (
          <SidebarGroup key={group.title}>
            {!collapsed && (
              <SidebarGroupLabel className="text-muted-foreground font-medium">
                {group.title}
              </SidebarGroupLabel>
            )}
            
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={getNavClassName(item.url)}
                        title={collapsed ? item.title : undefined}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span className="ml-3">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}