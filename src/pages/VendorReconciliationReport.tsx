import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      // Get all active patients for the clinic
      const { data: allPatients, error: patientsError } = await supabase
        .from('patients')
        .select('id, k_number, first_name, last_name, patient_type, email, phone')
        .eq('clinic_id', selectedClinic.id)
        .eq('status', 'active');

      if (patientsError) throw patientsError;

      const totalPatients = allPatients?.length || 0;

      // Get patients who have reports for this month and vendor
      const monthStart = startOfMonth(new Date(selectedMonth));
      const monthEnd = endOfMonth(new Date(selectedMonth));

      const { data: reportedPatients, error: reportsError } = await supabase
        .from('vendor_reports')
        .select('patient_id')
        .eq('clinic_id', selectedClinic.id)
        .eq('vendor_id', selectedVendor)
        .gte('report_month', format(monthStart, 'yyyy-MM-dd'))
        .lte('report_month', format(monthEnd, 'yyyy-MM-dd'));

      if (reportsError) throw reportsError;

      // Get unique patient IDs who have reports
      const reportedPatientIds = new Set(
        reportedPatients?.map((r) => r.patient_id) || []
      );

      // Find missing patients (those without reports)
      const missing = allPatients?.filter(
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
              <p className="text-xs text-muted-foreground">Active patients in clinic</p>
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
                    {missingPatients.map((patient) => (
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
