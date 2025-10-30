import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Search, Calendar } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';

type PharmacyReport = {
  id: string;
  pharmacy_id: string;
  vendor_id: string;
  patient_id: string;
  report_month: string;
  product_name: string;
  grams_sold: number;
  amount: number;
  created_at: string;
  pharmacies: { name: string };
  vendors: { name: string };
  patients: { first_name: string; last_name: string; k_number: string };
};

export default function PharmacyReportView() {
  const { toast } = useToast();
  const { selectedClinic } = useClinic();
  const [reports, setReports] = useState<PharmacyReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<PharmacyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchVendors();
    if (selectedClinic) {
      fetchReports();
    }
  }, [selectedClinic]);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, selectedMonth, selectedVendor]);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) throw error;
      
      if (data) {
        const uniqueVendors = Array.from(new Map(data.map(vendor => [vendor.name, vendor])).values());
        setVendors(uniqueVendors);
      } else {
        setVendors([]);
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch vendors',
        variant: 'destructive',
      });
    }
  };

  const fetchReports = async () => {
    if (!selectedClinic) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pharmacy_reports' as any)
        .select(`
          *,
          pharmacies (name),
          vendors (name),
          patients (first_name, last_name, k_number)
        `)
        .eq('clinic_id', selectedClinic.id)
        .order('report_month', { ascending: false });

      if (error) throw error;
      setReports(data as any || []);
      setFilteredReports(data as any || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch pharmacy reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    // Filter by search term (patient name or K number)
    if (searchTerm) {
      filtered = filtered.filter((report) => {
        if (!report.patients) return false;
        const patientName = `${report.patients.first_name || ''} ${report.patients.last_name || ''}`.toLowerCase();
        const kNumber = (report.patients.k_number || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return patientName.includes(search) || kNumber.includes(search);
      });
    }

    // Filter by month
    if (selectedMonth) {
      filtered = filtered.filter((report) => 
        report.report_month.startsWith(selectedMonth)
      );
    }

    // Filter by vendor
    if (selectedVendor && selectedVendor !== 'all') {
      filtered = filtered.filter((report) => 
        report.vendor_id === selectedVendor
      );
    }

    setFilteredReports(filtered);
  };

  const formatMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const totalGrams = filteredReports.reduce((sum, r) => sum + (r.grams_sold || 0), 0);
  const totalAmount = filteredReports.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pharmacy Reports</h1>
        <p className="text-muted-foreground">View and search uploaded pharmacy reports</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredReports.length}</div>
            <p className="text-xs text-muted-foreground">Patient purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Grams</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGrams.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Grams sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Patient</Label>
              <Input
                id="search"
                placeholder="Patient name or K number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Filter by Month</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">Filter by Vendor</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger id="vendor">
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
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

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Pharmacy Report Details
          </CardTitle>
          <CardDescription>
            {filteredReports.length} records found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Month</TableHead>
                  <TableHead>Pharmacy</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>K Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Grams</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No pharmacy reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatMonth(report.report_month)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{report.pharmacies?.name || 'Unknown Pharmacy'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{report.vendors?.name || 'Unknown Vendor'}</p>
                      </TableCell>
                      <TableCell>
                        <p>{report.patients?.first_name || 'N/A'} {report.patients?.last_name || ''}</p>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {report.patients?.k_number || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{report.product_name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-mono">{report.grams_sold?.toFixed(2) || '0.00'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-mono">${report.amount?.toFixed(2) || '0.00'}</p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
