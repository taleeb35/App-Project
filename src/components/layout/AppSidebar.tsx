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
  Database as DatabaseIcon,
  Search,
  Upload,
  Package,
  Building2,
  FileUp,
  Users,
  TestTube,
  Pill,
  Download,
  Crown,
  UserX,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const regularNavigationItems = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Patient Management",
    items: [
      { title: "Patient Database", url: "/patients", icon: DatabaseIcon },
      { title: "Upload Patient Data", url: "/upload/clinic", icon: Upload },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "Non-Ordering Report", url: "/reports/non-ordering", icon: UserX },
      { title: "Business Trending Report", url: "/reports/business-trending", icon: TrendingUp },
      { title: "Vendor Reconciliation Report", url: "/reports/vendor-reconciliation", icon: FileText },
    ],
  },
  {
    title: "Vendors",
    items: [
      { title: "Manage Vendors", url: "/vendors", icon: Package },
      { title: "Vendor Reports", url: "/vendors/reports", icon: FileUp },
    ],
  },
  {
    title: "Pharmacy",
    items: [
      { title: "Pharmacy Hub", url: "/pharmacy/reports", icon: Pill },
      { title: "Upload Report", url: "/pharmacy/upload", icon: Upload },
      { title: "View Reports", url: "/pharmacy/reports-view", icon: FileUp },
    ],
  },
];

const superAdminNavigationItems = [
  {
    title: "Super Admin",
    items: [
      { title: "Dashboard", url: "/super-admin", icon: Crown },
    ],
  },
  {
    title: "Management",
    items: [
      { title: "Manage Clinics", url: "/clinics", icon: Building2 },
    ],
  },
  {
    title: "Overview",
    items: [
      { title: "All Vendors", url: "/vendors", icon: Package },
      { title: "All Patients", url: "/patients", icon: DatabaseIcon },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { isAdmin, loading } = useUserRole();

  const navigationItems = isAdmin ? superAdminNavigationItems : regularNavigationItems;

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/") {
      // Exact match for vendor reports to avoid highlighting both tabs
      if (path === "/vendors/reports") {
        return currentPath === path || currentPath.startsWith(path + "/");
      }
      // Special handling for super admin dashboard
      if (path === "/super-admin") {
        return currentPath === path;
      }
      return currentPath === path || (currentPath.startsWith(path) && !currentPath.includes("/reports"));
    }
    return false;
  };

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-primary text-primary-foreground font-medium hover:bg-primary-hover" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";
  };

  if (loading) {
    return (
      <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
        <SidebarContent className="bg-card border-r">
          <div className="p-4">Loading...</div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r">
        {/* Logo/Brand */}
        <div className="p-4 border-b">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                {isAdmin ? <Crown className="w-4 h-4 text-primary-foreground" /> : <Pill className="w-4 h-4 text-primary-foreground" />}
              </div>
              <span className="font-semibold text-foreground">
                {isAdmin ? "Super Admin" : "MediCann Admin"}
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              {isAdmin ? <Crown className="w-4 h-4 text-primary-foreground" /> : <Pill className="w-4 h-4 text-primary-foreground" />}
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