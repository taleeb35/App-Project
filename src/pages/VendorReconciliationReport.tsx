import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, Package, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClinic } from '@/contexts/ClinicContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface MissingPatient {
  id: string;
  k_number: string;
  first_name: string;
  last_name: string;
  patient_type: string;
  email: string | null;
  phone: string | null;
}

interface Vendor {
  id: string;
  name: string;
}

export default function VendorReconciliationReport() {
  const { selectedClinic } = useClinic();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [missingPatients, setMissingPatients] = useState<MissingPatient[]>([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    reportedPatients: 0,
    missingPatients: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Generate months for the last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(startOfMonth(date), 'yyyy-MM-dd'),
      label: format(date, 'MMMM yyyy'),
    };
  });

  useEffect(() => {
    if (selectedClinic) {
      fetchVendors();
    }
  }, [selectedClinic]);

  useEffect(() => {
    if (selectedMonth && selectedVendor && selectedClinic) {
      fetchMissingPatients();
    }
  }, [selectedMonth, selectedVendor, selectedClinic]);

  const fetchVendors = async () => {
    if (!selectedClinic) return;

    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('clinic_id', selectedClinic.id)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch vendors',
        variant: 'destructive',
      });
    }
  };

  const fetchMissingPatients = async () => {
    if (!selectedClinic || !selectedMonth || !selectedVendor) return;

    setLoading(true);
    try {
      // Get patients associated with this specific vendor
      const { data: vendorPatients, error: vendorPatientsError } = await supabase
        .from('patient_vendors')
        .select('patient_id')
        .eq('vendor_id', selectedVendor);

      if (vendorPatientsError) throw vendorPatientsError;

      const vendorPatientIds = vendorPatients?.map((vp) => vp.patient_id) || [];

      if (vendorPatientIds.length === 0) {
        // No patients associated with this vendor
        setMissingPatients([]);
        setStats({
          totalPatients: 0,
          reportedPatients: 0,
          missingPatients: 0,
        });
        setLoading(false);
        return;
      }

      // Get full patient details for those associated with this vendor
      const { data: allVendorPatients, error: patientsError } = await supabase
        .from('patients')
        .select('id, k_number, first_name, last_name, patient_type, email, phone')
        .eq('clinic_id', selectedClinic.id)
        .eq('status', 'active')
        .in('id', vendorPatientIds);

      if (patientsError) throw patientsError;

      const totalPatients = allVendorPatients?.length || 0;

      // Get patients who have reports for this month and vendor
      // IMPORTANT: Only check for reports from patients associated with this vendor
      const monthStart = startOfMonth(new Date(selectedMonth));
      const monthEnd = endOfMonth(new Date(selectedMonth));

      const { data: reportedPatients, error: reportsError } = await supabase
        .from('vendor_reports')
        .select('patient_id')
        .eq('clinic_id', selectedClinic.id)
        .eq('vendor_id', selectedVendor)
        .in('patient_id', vendorPatientIds)
        .gte('report_month', format(monthStart, 'yyyy-MM-dd'))
        .lte('report_month', format(monthEnd, 'yyyy-MM-dd'));

      if (reportsError) throw reportsError;

      // Get unique patient IDs who have reports
      const reportedPatientIds = new Set(
        reportedPatients?.map((r) => r.patient_id) || []
      );

      // Find missing patients (those without reports)
      const missing = allVendorPatients?.filter(
        (patient) => !reportedPatientIds.has(patient.id)
      ) || [];

      setMissingPatients(missing);
      setStats({
        totalPatients,
        reportedPatients: reportedPatientIds.size,
        missingPatients: missing.length,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch reconciliation data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(missingPatients.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, missingPatients.length);
  const paginatedPatients = missingPatients.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push('ellipsis-start');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis-end');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Reconciliation Report</h1>
        <p className="text-muted-foreground">
          Identify patients who didn't make purchases for a specific month and vendor
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
          <CardDescription>Select month and vendor to view missing patients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Select Month
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Select Vendor
              </label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {selectedMonth && selectedVendor && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">Active patients for this vendor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reported Patients</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reportedPatients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPatients > 0
                  ? `${((stats.reportedPatients / stats.totalPatients) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missing Patients</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.missingPatients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPatients > 0
                  ? `${((stats.missingPatients / stats.totalPatients) * 100).toFixed(1)}% of total`
                  : '0% of total'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Missing Patients Table */}
      {selectedMonth && selectedVendor && (
        <Card>
          <CardHeader>
            <CardTitle>Missing Patients</CardTitle>
            <CardDescription>
              Patients who did not make purchases in {format(new Date(selectedMonth), 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : missingPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No missing patients found. All patients have reported purchases!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>K Number</TableHead>
                        <TableHead>Patient Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {patient.k_number}
                            </code>
                          </TableCell>
                          <TableCell className="font-medium">
                            {patient.first_name} {patient.last_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={patient.patient_type === 'Veteran' ? 'default' : 'secondary'}>
                              {patient.patient_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{patient.email || 'N/A'}</TableCell>
                          <TableCell>{patient.phone || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{endIndex} of {missingPatients.length}
                    </span>
                    <Select value={pageSize.toString()} onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 / page</SelectItem>
                        <SelectItem value="50">50 / page</SelectItem>
                        <SelectItem value="75">75 / page</SelectItem>
                        <SelectItem value="100">100 / page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {getPageNumbers().map((page, index) => {
                          if (typeof page === 'string') {
                            return (
                              <PaginationItem key={`${page}-${index}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
