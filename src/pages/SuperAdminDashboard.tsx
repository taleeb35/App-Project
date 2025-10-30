import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Package, Filter, TrendingUp, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit } from "lucide-react";

type Clinic = {
  id: string;
  name: string;
  patient_count?: number;
  vendor_count?: number;
};

type Employee = {
  id: string;
  user_id: string;
  clinic_id: string;
  email: string;
  full_name: string;
  phone: string;
  status: string;
  clinic_name: string;
};

type Vendor = {
  id: string;
  name: string;
  clinic_id: string | null;
  clinic_name?: string;
  status: string | null;
  license_number: string | null;
};

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  k_number: string;
  patient_type: string | null;
  status: string | null;
  clinic_id: string;
  clinic_name?: string;
  totalSpent?: number;
  lastPurchaseDate?: Date | null;
};

type Report = {
  patient_id: string;
  clinic_id: string;
  report_month: string;
  amount: number;
};

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Filters
  const [clinicFilter, setClinicFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [patientTypeFilter, setPatientTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [employeesPage, setEmployeesPage] = useState(1);
  const itemsPerPage = 10;
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    clinicId: '',
    status: 'active',
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all clinics
      const { data: clinicsData, error: clinicsError } = await supabase
        .from('clinics')
        .select('*')
        .order('name');
      if (clinicsError) throw clinicsError;

      // Fetch all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('clinic_employees')
        .select(`
          id,
          user_id,
          clinic_id,
          clinics!clinic_employees_clinic_id_fkey (name)
        `);
      if (employeesError) throw employeesError;

      // Get employee profiles
      const userIds = employeesData?.map((emp: any) => emp.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, status')
        .in('id', userIds);
      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);
      const formattedEmployees = employeesData?.map((emp: any) => {
        const profile = profilesMap.get(emp.user_id);
        return {
          id: emp.id,
          user_id: emp.user_id,
          clinic_id: emp.clinic_id,
          email: profile?.email || '',
          full_name: profile?.full_name || '',
          phone: profile?.phone || '',
          status: profile?.status || 'active',
          clinic_name: emp.clinics?.name || '',
        };
      }) || [];

      // Fetch all vendors (deduplicated by name to avoid duplicates)
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('name');
      if (vendorsError) throw vendorsError;

      // Deduplicate vendors by name (keep only first occurrence)
      const uniqueVendorsMap = new Map();
      vendorsData?.forEach(vendor => {
        if (!uniqueVendorsMap.has(vendor.name)) {
          uniqueVendorsMap.set(vendor.name, vendor);
        }
      });
      const deduplicatedVendors = Array.from(uniqueVendorsMap.values());

      // Fetch all patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('first_name');
      if (patientsError) throw patientsError;

      // Fetch all vendor reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('vendor_reports')
        .select('patient_id, clinic_id, report_month, amount');
      if (reportsError) throw reportsError;

      // Create clinic name map
      const clinicMap = new Map((clinicsData || []).map(c => [c.id, c.name]));

      // Add clinic names to vendors and patients
      const vendorsWithClinic = deduplicatedVendors.map(v => ({
        ...v,
        clinic_name: v.clinic_id ? clinicMap.get(v.clinic_id) || 'Unknown' : 'Unassigned'
      }));

      const patientsWithClinic = (patientsData || []).map(p => ({
        ...p,
        clinic_name: clinicMap.get(p.clinic_id) || 'Unknown'
      }));

      setClinics(clinicsData || []);
      setEmployees(formattedEmployees);
      setVendors(vendorsWithClinic);
      setPatients(patientsWithClinic);
      setReports(reportsData || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.email || !newEmployee.password || !newEmployee.fullName || !newEmployee.phone || !newEmployee.clinicId) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmployee.email,
        password: newEmployee.password,
        options: {
          data: {
            full_name: newEmployee.fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update profile with clinic_id, phone, and status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          clinic_id: newEmployee.clinicId,
          phone: newEmployee.phone,
          status: newEmployee.status,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Create clinic employee assignment
      const { error: assignError } = await supabase
        .from('clinic_employees')
        .insert({
          user_id: authData.user.id,
          clinic_id: newEmployee.clinicId,
        });

      if (assignError) throw assignError;

      toast({
        title: 'Success',
        description: 'Sub Admin account created successfully. Share the credentials with them.',
      });

      setIsAddDialogOpen(false);
      setNewEmployee({ email: '', password: '', fullName: '', phone: '', clinicId: '', status: 'active' });
      fetchAllData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add sub admin',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this sub admin?')) return;

    setLoading(true);
    try {
      // Delete clinic employee assignment
      const { error: assignError } = await supabase
        .from('clinic_employees')
        .delete()
        .eq('id', employeeId);

      if (assignError) throw assignError;

      // Note: We don't delete the user from auth.users or profiles
      // Just remove their clinic assignment

      toast({
        title: 'Success',
        description: 'Sub admin removed successfully',
      });

      fetchAllData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove sub admin',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Status updated to ${newStatus}`,
      });

      fetchAllData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate processed patients with spending data
  const processedPatients = useMemo(() => {
    const reportMap = new Map<string, { totalSpent: number; purchaseDates: Date[] }>();
    reports.forEach(report => {
      if (!reportMap.has(report.patient_id)) {
        reportMap.set(report.patient_id, { totalSpent: 0, purchaseDates: [] });
      }
      const entry = reportMap.get(report.patient_id)!;
      entry.totalSpent += report.amount || 0;
      entry.purchaseDates.push(new Date(report.report_month));
    });

    return patients.map(p => {
      const reportData = reportMap.get(p.id);
      const purchaseDates = reportData?.purchaseDates.sort((a, b) => b.getTime() - a.getTime()) || [];
      return {
        ...p,
        totalSpent: reportData?.totalSpent || 0,
        lastPurchaseDate: purchaseDates.length > 0 ? purchaseDates[0] : null,
      };
    });
  }, [patients, reports]);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return processedPatients.filter(patient => {
      const matchesClinic = clinicFilter === "all" || patient.clinic_id === clinicFilter;
      const matchesType = patientTypeFilter === "all" || patient.patient_type === patientTypeFilter;
      const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
      const matchesSearch = searchTerm === "" || 
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.k_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesClinic && matchesType && matchesStatus && matchesSearch;
    });
  }, [processedPatients, clinicFilter, patientTypeFilter, statusFilter, searchTerm]);

  // Calculate stats
  const totalRevenue = useMemo(() => {
    return reports.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [reports]);

  const activePatients = patients.filter(p => p.status === 'active').length;
  const veteransCount = patients.filter(p => p.patient_type === 'Veteran').length;
  const civilianCount = patients.filter(p => p.patient_type !== 'Veteran').length;

  // Summary cards data
  const summaryStats = [
    {
      title: "Total Clinics",
      value: clinics.length,
      icon: Building2,
      color: "text-primary"
    },
    {
      title: "Total Vendors",
      value: vendors.length,
      subtitle: `${vendors.filter(v => v.status === 'active').length} active`,
      icon: Package,
      color: "text-success"
    },
    {
      title: "Total Patients",
      value: patients.length,
      subtitle: `${activePatients} active`,
      icon: Users,
      color: "text-muted-foreground"
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-primary"
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Complete overview of all clinics, vendors, and patients</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              {stat.subtitle && <p className="text-xs text-muted-foreground">{stat.subtitle}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub Admin Management Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sub Admin Management</CardTitle>
            <CardDescription>Create and manage sub admin accounts for clinic access</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Sub Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Sub Admin</DialogTitle>
                <DialogDescription>
                  Create a sub admin account with login credentials to share
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={newEmployee.fullName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Set Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    placeholder="Create a secure password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clinic">Assign to Clinic *</Label>
                  <Select
                    value={newEmployee.clinicId}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, clinicId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select clinic" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinics.map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Account Status *</Label>
                  <Select
                    value={newEmployee.status}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active (Can Login)</SelectItem>
                      <SelectItem value="draft">Draft (Cannot Login)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddEmployee} disabled={loading} className="w-full">
                  {loading ? 'Creating Account...' : 'Create Sub Admin Account'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Assigned Clinic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.slice((employeesPage - 1) * itemsPerPage, employeesPage * itemsPerPage).map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.full_name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.phone || 'N/A'}</TableCell>
                  <TableCell>{employee.clinic_name}</TableCell>
                  <TableCell>
                    <Select
                      value={employee.status}
                      onValueChange={(value) => handleUpdateStatus(employee.user_id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <Badge variant="default" className="w-full">Active</Badge>
                        </SelectItem>
                        <SelectItem value="draft">
                          <Badge variant="secondary" className="w-full">Draft</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEmployee(employee.id, employee.user_id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {Math.ceil(employees.length / itemsPerPage) > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setEmployeesPage(Math.max(1, employeesPage - 1))} className={employeesPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
                {Array.from({ length: Math.ceil(employees.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}><PaginationLink onClick={() => setEmployeesPage(page)} isActive={employeesPage === page} className="cursor-pointer">{page}</PaginationLink></PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => setEmployeesPage(Math.min(Math.ceil(employees.length / itemsPerPage), employeesPage + 1))} className={employeesPage === Math.ceil(employees.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
