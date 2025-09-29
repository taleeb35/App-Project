import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import PatientDatabase from "./pages/PatientDatabase";
import PatientSearch from "./pages/PatientSearch";
import UploadClinic from "./pages/UploadClinic";
import UploadVendor from "./pages/UploadVendor";
import UploadPharmacy from "./pages/UploadPharmacy";
import Reports from "./pages/Reports";
import VendorReports from "./pages/VendorReports";
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
          <Route path="/patients" element={<AdminLayout><PatientDatabase /></AdminLayout>} />
          <Route path="/patients/search" element={<AdminLayout><PatientSearch /></AdminLayout>} />
          <Route path="/upload/clinic" element={<AdminLayout><UploadClinic /></AdminLayout>} />
          <Route path="/upload/vendor" element={<AdminLayout><UploadVendor /></AdminLayout>} />
          <Route path="/upload/pharmacy" element={<AdminLayout><UploadPharmacy /></AdminLayout>} />
          <Route path="/vendors" element={<AdminLayout><Vendors /></AdminLayout>} />
          <Route path="/vendors/reports" element={<AdminLayout><VendorReports /></AdminLayout>} />
          <Route path="/reports" element={<AdminLayout><Reports /></AdminLayout>} />
          <Route path="/reports/reconciliation" element={<AdminLayout><Reports /></AdminLayout>} />
          <Route path="/reports/non-ordering" element={<AdminLayout><Reports /></AdminLayout>} />
          <Route path="/reports/trending" element={<AdminLayout><Reports /></AdminLayout>} />
          <Route path="/exceptions" element={<AdminLayout><Exceptions /></AdminLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
