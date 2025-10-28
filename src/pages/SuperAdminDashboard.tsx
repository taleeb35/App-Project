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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

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
  const [patientsPage, setPatientsPage] = useState(1);
  const [clinicsPage, setClinicsPage] = useState(1);
  const [employeesPage, setEmployeesPage] = useState(1);
  const [vendorsPage, setVendorsPage] = useState(1);
  const itemsPerPage = 10;

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
        .select('id, email, full_name')
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
          clinic_name: emp.clinics?.name || '',
        };
      }) || [];

      // Fetch all vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('name');
      if (vendorsError) throw vendorsError;

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
      const vendorsWithClinic = (vendorsData || []).map(v => ({
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
      title: "Total Employees",
      value: employees.length,
      icon: Users,
      color: "text-accent"
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
          <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Complete overview of all clinics, employees, vendors, and patients</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

      {/* Tabs for different views */}
      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="clinics">Clinics</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label>Search</Label>
                  <Input 
                    placeholder="Name or K#..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Clinic</Label>
                  <Select value={clinicFilter} onValueChange={setClinicFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clinics</SelectItem>
                      {clinics.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Patient Type</Label>
                  <Select value={patientTypeFilter} onValueChange={setPatientTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Veteran">Veterans</SelectItem>
                      <SelectItem value="Civilian">Civilians</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setClinicFilter("all");
                      setPatientTypeFilter("all");
                      setStatusFilter("all");
                      setSearchTerm("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Patients ({filteredPatients.length})</CardTitle>
              <CardDescription>Veterans: {filteredPatients.filter(p => p.patient_type === 'Veteran').length} | Civilians: {filteredPatients.filter(p => p.patient_type !== 'Veteran').length}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>K Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Purchase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">No patients found</TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.slice((patientsPage - 1) * itemsPerPage, patientsPage * itemsPerPage).map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.first_name} {patient.last_name}</TableCell>
                        <TableCell>{patient.k_number}</TableCell>
                        <TableCell>
                          <Badge variant={patient.patient_type === 'Veteran' ? 'default' : 'secondary'}>
                            {patient.patient_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{patient.clinic_name}</TableCell>
                        <TableCell>
                          <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                            {patient.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${patient.totalSpent?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          {patient.lastPurchaseDate 
                            ? patient.lastPurchaseDate.toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {Math.ceil(filteredPatients.length / itemsPerPage) > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPatientsPage(Math.max(1, patientsPage - 1))}
                        className={patientsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.ceil(filteredPatients.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setPatientsPage(page)}
                          isActive={patientsPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPatientsPage(Math.min(Math.ceil(filteredPatients.length / itemsPerPage), patientsPage + 1))}
                        className={patientsPage === Math.ceil(filteredPatients.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinics Tab */}
        <TabsContent value="clinics">
          <Card>
            <CardHeader>
              <CardTitle>All Clinics ({clinics.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic Name</TableHead>
                    <TableHead>License #</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinics.slice((clinicsPage - 1) * itemsPerPage, clinicsPage * itemsPerPage).map((clinic) => (
                    <TableRow key={clinic.id}>
                      <TableCell className="font-medium">{clinic.name}</TableCell>
                      <TableCell>{(clinic as any).license_number || 'N/A'}</TableCell>
                      <TableCell>{(clinic as any).email || 'N/A'}</TableCell>
                      <TableCell>{(clinic as any).phone || 'N/A'}</TableCell>
                      <TableCell>{(clinic as any).address || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {Math.ceil(clinics.length / itemsPerPage) > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setClinicsPage(Math.max(1, clinicsPage - 1))} className={clinicsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                    {Array.from({ length: Math.ceil(clinics.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}><PaginationLink onClick={() => setClinicsPage(page)} isActive={clinicsPage === page} className="cursor-pointer">{page}</PaginationLink></PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext onClick={() => setClinicsPage(Math.min(Math.ceil(clinics.length / itemsPerPage), clinicsPage + 1))} className={clinicsPage === Math.ceil(clinics.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>All Employees ({employees.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Clinic</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.slice((employeesPage - 1) * itemsPerPage, employeesPage * itemsPerPage).map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.full_name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.clinic_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {Math.ceil(employees.length / itemsPerPage) > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem><PaginationPrevious onClick={() => setEmployeesPage(Math.max(1, employeesPage - 1))} className={employeesPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                    {Array.from({ length: Math.ceil(employees.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}><PaginationLink onClick={() => setEmployeesPage(page)} isActive={employeesPage === page} className="cursor-pointer">{page}</PaginationLink></PaginationItem>
                    ))}
                    <PaginationItem><PaginationNext onClick={() => setEmployeesPage(Math.min(Math.ceil(employees.length / itemsPerPage), employeesPage + 1))} className={employeesPage === Math.ceil(employees.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle>All Vendors ({vendors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>License #</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.license_number || 'N/A'}</TableCell>
                      <TableCell>{vendor.clinic_name}</TableCell>
                      <TableCell>
                        <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                          {vendor.status || 'unknown'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
