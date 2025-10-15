import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar'; // Corrected import
import TopHeader from '@/components/layout/TopHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster"

export function AdminLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <AppSidebar />
      <div className="flex flex-col">
        <TopHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}