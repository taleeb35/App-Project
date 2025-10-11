import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function TopHeader() {
  const notifications = 3;
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />
        
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">Patient Management System</h1>
          <Badge variant="secondary" className="bg-primary/10 text-primary">Admin</Badge>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {notifications}
              </Badge>
            )}
          </Button>
          
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} title="Sign Out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}