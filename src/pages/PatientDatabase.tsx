import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, DollarSign, TrendingUp } from "lucide-react";
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
  vendor_id: string | null;
  created_at: string;
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
  const [activityFilter, setActivityFilter] = useState("all");
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
    vendor_id: "",
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
        .select('*')
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
      toast({
        title: "Error",
        description: "Failed to fetch patient data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => { /* ... existing code ... */ };
  const fetchVendors = async () => { /* ... existing code ... */ };
  const handleAddPatient = async () => { /* ... existing code ... */ };
  const handleEditPatient = (patient: Patient) => { /* ... existing code ... */ };
  const handleUpdatePatient = async () => { /* ... existing code ... */ };
  const handleDeletePatient = async (id: string) => { /* ... existing code ... */ };

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

  const monthlyStats = useMemo(() => {
    const statsByMonth: { [key: string]: any } = {};
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    reports.forEach(report => {
      const month = report.report_month.slice(0, 7); // YYYY-MM
      if (!statsByMonth[month]) {
        statsByMonth[month] = {
          month,
          veteransWhoOrdered: new Set(),
          civiliansWhoOrdered: new Set(),
          veteranPurchaseTotal: 0,
          civilianPurchaseTotal: 0,
        };
      }

      const patient = processedPatients.find(p => p.id === report.patient_id);
      if (patient) {
        if (patient.patient_type === 'Veteran') {
          statsByMonth[month].veteransWhoOrdered.add(patient.id);
          statsByMonth[month].veteranPurchaseTotal += report.amount || 0;
        } else {
          statsByMonth[month].civiliansWhoOrdered.add(patient.id);
          statsByMonth[month].civilianPurchaseTotal += report.amount || 0;
        }
      }
    });

    const activeVeterans = processedPatients.filter(p => p.status === 'active' && p.patient_type === 'Veteran').length;
    const activeCivilians = processedPatients.filter(p => p.status === 'active' && p.patient_type !== 'Veteran').length;

    return Object.values(statsByMonth).map(monthData => ({
      ...monthData,
      totalActiveVeterans: activeVeterans,
      percentVeteransOrdered: activeVeterans > 0 ? (monthData.veteransWhoOrdered.size / activeVeterans) * 100 : 0,
      totalActiveCivilians: activeCivilians,
      percentCiviliansOrdered: activeCivilians > 0 ? (monthData.civiliansWhoOrdered.size / activeCivilians) * 100 : 0,
    })).sort((a, b) => b.month.localeCompare(a.month));
  }, [processedPatients, reports]);

  const filteredPatients = useMemo(() => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return processedPatients.filter(patient => {
      const matchesName = searchName === "" || `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchName.toLowerCase());
      const matchesKNumber = searchKNumber === "" || patient.k_number.toLowerCase().includes(searchKNumber.toLowerCase());
      
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
      
      return matchesName && matchesKNumber && matchesActivity;
    });
  }, [processedPatients, searchName, searchKNumber, activityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    veterans: patients.filter(p => p.patient_type === 'Veteran').length,
    civilians: patients.filter(p => p.patient_type === 'Civilian').length,
  };

  return (
    <div className="space-y-6">
      {/* ... existing header and stats cards ... */}

      {/* Monthly Summary Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Monthly Activity Summary
          </CardTitle>
          <CardDescription>A breakdown of patient purchasing activity by month.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Active Veterans</TableHead>
                <TableHead>% Veterans Ordered</TableHead>
                <TableHead>Veteran Purchases</TableHead>
                <TableHead>Active Civilians</TableHead>
                <TableHead>% Civilians Ordered</TableHead>
                <TableHead>Civilian Purchases</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No purchase data available for summary.</TableCell>
                </TableRow>
              ) : (
                monthlyStats.slice(0, 6).map(stat => ( // Show last 6 months
                  <TableRow key={stat.month}>
                    <TableCell className="font-medium">{new Date(stat.month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</TableCell>
                    <TableCell>{stat.totalActiveVeterans}</TableCell>
                    <TableCell>{stat.percentVeteransOrdered.toFixed(1)}%</TableCell>
                    <TableCell>${stat.veteranPurchaseTotal.toFixed(2)}</TableCell>
                    <TableCell>{stat.totalActiveCivilians}</TableCell>
                    <TableCell>{stat.percentCiviliansOrdered.toFixed(1)}%</TableCell>
                    <TableCell>${stat.civilianPurchaseTotal.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search & Filter Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search_name" className="text-sm font-medium mb-2 block">
                Search by Name
              </Label>
              <Input
                id="search_name"
                placeholder="Enter patient name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="search_k_number" className="text-sm font-medium mb-2 block">
                Search by K Number
              </Label>
              <Input
                id="search_k_number"
                placeholder="Enter K number..."
                value={searchKNumber}
                onChange={(e) => setSearchKNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="activity_filter" className="text-sm font-medium mb-2 block">
                Filter by Activity
              </Label>
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger id="activity_filter">
                  <SelectValue placeholder="Filter patients..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
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
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>K Number</TableHead>
                    <TableHead>Patient Type</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No patients found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{patient.first_name} {patient.last_name}</p>
                            {patient.email && <p className="text-sm text-muted-foreground">{patient.email}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{patient.k_number}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={patient.patient_type === 'Veteran' ? 'default' : 'outline'}>
                            {patient.patient_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">${patient.totalSpent?.toFixed(2) || '0.00'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{patient.lastPurchaseDate ? patient.lastPurchaseDate.toLocaleDateString() : 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditPatient(patient)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeletePatient(patient.id)}>
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="75">75</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">per page</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {/* ... existing dialog code ... */}
      </Dialog>
    </div>
  );
}