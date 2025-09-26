import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopHeader() {
  const [selectedClinic, setSelectedClinic] = useState("clinic-1");
  const notifications = 3;

  const clinics = [
    { id: "clinic-1", name: "Downtown Medical Center", patients: 1247 },
    { id: "clinic-2", name: "Westside Cannabis Clinic", patients: 892 },
    { id: "clinic-3", name: "Northpoint Wellness", patients: 656 },
    { id: "clinic-4", name: "Riverside Medical", patients: 423 },
    { id: "clinic-5", name: "Central Health Center", patients: 334 },
  ];

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
        {/* Clinic Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active Clinic:</span>
          <Select value={selectedClinic} onValueChange={setSelectedClinic}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {clinics.map((clinic) => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  <div className="flex justify-between items-center w-full">
                    <span>{clinic.name}</span>
                    <Badge variant="outline" className="ml-2">{clinic.patients} patients</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
          
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}