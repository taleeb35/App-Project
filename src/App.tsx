import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import PatientDatabase from "./pages/PatientDatabase";
import PatientSearch from "./pages/PatientSearch";
import UploadClinic from "./pages/UploadClinic";
import UploadVendor from "./pages/UploadVendor";
import UploadPharmacy from "./pages/UploadPharmacy";
import UploadPatients from "./pages/UploadPatients";
import Reports from "./pages/Reports";
import Vendors from "./pages/Vendors";
import Clinics from "./pages/Clinics";
import Exceptions from "./pages/Exceptions";
import Employees from "./pages/Employees";
import DummyData from "./pages/DummyData";
import VendorReportUpload from "./pages/VendorReportUpload";
import VendorReportView from "./pages/VendorReportView";
import VendorReports from "./pages/VendorReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/super-admin" element={<ProtectedRoute><AdminLayout><SuperAdminDashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><AdminLayout><Reports /></AdminLayout></ProtectedRoute>} />
            <Route path="/patients/search" element={<ProtectedRoute><AdminLayout><PatientSearch /></AdminLayout></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><AdminLayout><PatientDatabase /></AdminLayout></ProtectedRoute>} />
            <Route path="/upload/clinic" element={<ProtectedRoute><AdminLayout><UploadClinic /></AdminLayout></ProtectedRoute>} />
            <Route path="/upload/vendor" element={<ProtectedRoute><AdminLayout><UploadVendor /></AdminLayout></ProtectedRoute>} />
            <Route path="/upload/pharmacy" element={<ProtectedRoute><AdminLayout><UploadPharmacy /></AdminLayout></ProtectedRoute>} />
            <Route path="/upload/patients" element={<ProtectedRoute><UploadPatients /></ProtectedRoute>} />
            <Route path="/vendors" element={<ProtectedRoute><AdminLayout><Vendors /></AdminLayout></ProtectedRoute>} />
            <Route path="/clinics" element={<ProtectedRoute><AdminLayout><Clinics /></AdminLayout></ProtectedRoute>} />
            <Route path="/vendors/reports" element={<ProtectedRoute><AdminLayout><VendorReports /></AdminLayout></ProtectedRoute>} />
            <Route path="/exceptions" element={<ProtectedRoute><AdminLayout><Exceptions /></AdminLayout></ProtectedRoute>} />
            
            <Route path="/employees" element={<ProtectedRoute><AdminLayout><Employees /></AdminLayout></ProtectedRoute>} />
            <Route path="/dummy-data" element={<ProtectedRoute><AdminLayout><DummyData /></AdminLayout></ProtectedRoute>} />
            <Route path="/vendors/upload" element={<AdminLayout><VendorReportUpload /></AdminLayout>} />
            <Route path="/vendors/reports-view" element={<ProtectedRoute><AdminLayout><VendorReportView /></AdminLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
