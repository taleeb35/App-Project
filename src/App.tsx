import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import PatientSearch from "./pages/PatientSearch";
import UploadClinic from "./pages/UploadClinic";
import Reports from "./pages/Reports";
import Vendors from "./pages/Vendors";
import Exceptions from "./pages/Exceptions";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminLayout><Dashboard /></AdminLayout>} />
          <Route path="/notifications" element={<AdminLayout><Notifications /></AdminLayout>} />
          <Route path="/patients/search" element={<AdminLayout><PatientSearch /></AdminLayout>} />
          <Route path="/upload/clinic" element={<AdminLayout><UploadClinic /></AdminLayout>} />
          <Route path="/vendors" element={<AdminLayout><Vendors /></AdminLayout>} />
          <Route path="/reports" element={<AdminLayout><Reports /></AdminLayout>} />
          <Route path="/exceptions" element={<AdminLayout><Exceptions /></AdminLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
