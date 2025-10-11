import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { ClinicProvider } from "@/contexts/ClinicContext";
import { VendorProvider } from "@/contexts/VendorContext";
import { seedInitialData } from "@/utils/seedInitialData";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  useEffect(() => {
    // Seed initial data on first load
    seedInitialData();
  }, []);

  return (
    <ClinicProvider>
      <VendorProvider>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            
            <div className="flex-1 flex flex-col">
              <TopHeader />
              
              <main className="flex-1 p-6 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </VendorProvider>
    </ClinicProvider>
  );
}