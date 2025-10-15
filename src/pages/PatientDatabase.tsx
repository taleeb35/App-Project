import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, DollarSign, TrendingUp, Building2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useClinic } from "@/contexts/ClinicContext";

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  k_number: string;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string | null;
  patient_type: string | null;
  preferred_vendor_id: string | null;
  clinic_id: string;
  created_at: string;
  vendors: { name: string } | null; // For joined vendor name
  totalSpent?: number;
  lastPurchaseDate?: Date | null;
};

type Clinic = {
  id: string;
  name: string;
};

type Vendor = {
  id: string;
  name: string;
};

type Report = {
  patient_id: string;
  report_month: string;
  amount: number;
};

export default function PatientDatabase() {
  const { toast } = useToast();
  const { selectedClinic } = useClinic();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [searchKNumber, setSearchKNumber] = useState("");
  const [activityFilter, setActivityFilter] = useState("all_activity");
  const [statusFilter, setStatusFilter] = useState("all_status");
  const [vendorFilter, setVendorFilter] = useState("all_vendors");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    k_number: "",
    date_of_birth: "",
    phone: "",
    email: "",
    address: "",
    patient_type: "Civilian",
    clinic_id: "",
    preferred_vendor_id: "",
  });

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (selectedClinic) {
      fetchPatientData();
    } else {
      setPatients([]);
      setReports([]);
    }
  }, [selectedClinic]);

  const fetchBaseData = async () => {
    await fetchClinics();
    await fetchVendors();
  };

  const fetchPatientData = async () => {
    if (!selectedClinic) return;
    setLoading(true);
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*, vendors:preferred_vendor_id ( name )')
        .eq('clinic_id', selectedClinic.id)
        .order('created_at', { ascending: false });

      if (patientError) throw patientError;

      const { data: reportData, error: reportError } = await supabase
        .from('vendor_reports')
        .select('patient_id, report_month, amount')
        .eq('clinic_id', selectedClinic.id);
      
      if (reportError) throw reportError;
      
      setPatients((patientData as any) || []);
      setReports((reportData as any) || []);

    } catch (error: any) {
      toast({ title: "Error", description: "Failed to fetch patient data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => { /* ... existing code ... */ };
  const fetchVendors = async () => { 
    try {
        const { data, error } = await supabase.from('vendors').select('id, name').order('name');
        if (error) throw error;
        if (data) {
            const uniqueVendors = Array.from(new Map(data.map(v => [v.name, v])).values());
            setVendors(uniqueVendors);
        }
    } catch (error) {
        console.error("Error fetching vendors:", error);
    }
   };
  const handleAddPatient = async () => { /* ... existing code ... */ };
  const handleEditPatient = (patient: Patient) => { /* ... existing code ... */ };
  const handleUpdatePatient = async () => { /* ... existing code ... */ };
  const handleDeletePatient = async (id: string) => { /* ... existing code ... */ };

  const handleStatusChange = async (patientId: string, newStatus: string) => {
    try {
        const { error } = await supabase
            .from('patients')
            .update({ status: newStatus })
            .eq('id', patientId);
        
        if (error) throw error;
        
        toast({ title: "Success", description: "Patient status updated successfully." });
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status: newStatus } : p));
    } catch (error: any) {
        toast({ title: "Error", description: `Failed to update status: ${error.message}`, variant: "destructive" });
    }
  };

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

  const monthlyStats = useMemo(() => { /* ... existing code ... */ }, [processedPatients, reports]);

  const filteredPatients = useMemo(() => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return processedPatients.filter(patient => {
      const matchesName = searchName === "" || `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchName.toLowerCase());
      const matchesKNumber = searchKNumber === "" || patient.k_number.toLowerCase().includes(searchKNumber.toLowerCase());
      const matchesStatus = statusFilter === 'all_status' || patient.status === statusFilter;
      const matchesVendor = vendorFilter === 'all_vendors' || patient.preferred_vendor_id === vendorFilter;
      
      let matchesActivity = true;
      switch(activityFilter) {
        case 'zero_sales':
          matchesActivity = patient.totalSpent === 0;
          break;
        case 'inactive_veterans':
          matchesActivity = patient.patient_type === 'Veteran' && (!patient.lastPurchaseDate || patient.lastPurchaseDate < twoMonthsAgo);
          break;
        case 'inactive_civilians':
          matchesActivity = patient.patient_type !== 'Veteran' && (!patient.lastPurchaseDate || patient.lastPurchaseDate < threeMonthsAgo);
          break;
        default:
          matchesActivity = true;
      }
      
      return matchesName && matchesKNumber && matchesStatus && matchesVendor && matchesActivity;
    });
  }, [processedPatients, searchName, searchKNumber, activityFilter, statusFilter, vendorFilter]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* ... existing header ... */}

      {/* Monthly Summary Report Card ... */}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search & Filter Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search_name">Search by Name</Label>
              <Input id="search_name" placeholder="Enter patient name..." value={searchName} onChange={(e) => setSearchName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="search_k_number">Search by K Number</Label>
              <Input id="search_k_number" placeholder="Enter K number..." value={searchKNumber} onChange={(e) => setSearchKNumber(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="status_filter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status_filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_status">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vendor_filter">Filter by Vendor</Label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger id="vendor_filter"><SelectValue placeholder="All Vendors" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_vendors">All Vendors</SelectItem>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-4">
               <Label htmlFor="activity_filter">Filter by Activity</Label>
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                    <SelectTrigger id="activity_filter"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all_activity">All Activity</SelectItem>
                        <SelectItem value="zero_sales">No Purchases Made</SelectItem>
                        <SelectItem value="inactive_veterans">Inactive Veterans (2+ months)</SelectItem>
                        <SelectItem value="inactive_civilians">Inactive Civilians (3+ months)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Registry</CardTitle>
          <CardDescription>Showing {paginatedPatients.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredPatients.length)} of {filteredPatients.length} patients</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? ( <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div> ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>K Number</TableHead>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPatients.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No patients found matching your criteria.</TableCell></TableRow>
                  ) : (
                    paginatedPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{patient.first_name} {patient.last_name}</p>
                            <p className="text-sm text-muted-foreground">{patient.patient_type}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{patient.k_number}</code>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{patient.vendors?.name || 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          <Select value={patient.status || ''} onValueChange={(newStatus) => handleStatusChange(patient.id, newStatus)}>
                              <SelectTrigger className={cn("w-28", patient.status === 'active' ? 'border-green-500' : 'border-red-500')}>
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">${patient.totalSpent?.toFixed(2) || '0.00'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{patient.lastPurchaseDate ? patient.lastPurchaseDate.toLocaleDateString() : 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditPatient(patient)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeletePatient(patient.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  {/* ... existing pagination controls ... */}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialogs */}
      {/* ... existing dialog code ... */}
    </div>
  );
}