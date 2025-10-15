import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClinicProvider } from './contexts/ClinicContext';
import { AdminLayout } from './components/layout/AdminLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PatientDatabase from './pages/PatientDatabase';
import Clinics from './pages/Clinics';
import Employees from './pages/Employees';
import Vendors from './pages/Vendors';
import VendorReportUpload from './pages/VendorReportUpload';
import VendorReportView from './pages/VendorReportView';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={!user ? <Auth /> : (isAdmin ? <Navigate to="/super-admin" replace /> : <Navigate to="/dashboard" replace />)} />

      {/* Redirect from root based on role */}
      <Route path="/" element={!user ? <Navigate to="/auth" replace /> : (isAdmin ? <Navigate to="/super-admin" replace /> : <Navigate to="/dashboard" replace />)} />

      <Route 
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/super-admin" element={isAdmin ? <SuperAdminDashboard /> : <Navigate to="/dashboard" replace />} />
        <Route path="/patients" element={<PatientDatabase />} />
        <Route path="/clinics" element={isAdmin ? <Clinics /> : <NotFound />} />
        <Route path="/employees" element={isAdmin ? <Employees /> : <NotFound />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/upload-report" element={<VendorReportUpload />} />
        <Route path="/view-reports" element={<VendorReportView />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ClinicProvider>
          <AppRoutes />
        </ClinicProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;