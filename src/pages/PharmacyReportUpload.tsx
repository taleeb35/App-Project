import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

export default function PharmacyReportUpload() {
  const { toast } = useToast();
  const { selectedClinic } = useClinic();
  const { user } = useAuth();
  const [selectedVendor, setSelectedVendor] = useState('');
  const [reportMonth, setReportMonth] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');

  useEffect(() => {
    if (user) {
      fetchVendors();
      fetchPharmacies();
    }
  }, [user]);

  const fetchVendors = async () => {
    if (!user) { setVendors([]); return; }
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('status', 'active')
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

  const fetchPharmacies = async () => {
    if (!user) { setPharmacies([]); return; }
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setPharmacies(data || []);
      
      // Auto-select first pharmacy if only one exists
      if (data && data.length === 1) {
        setSelectedPharmacy(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch pharmacies',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File',
          description: 'Please upload an Excel (.xlsx, .xls) or CSV (.csv) file',
          variant: 'destructive',
        });
        return;
      }
      setUploadFile(file);
    }
  };

  const parseFile = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedClinic) {
      toast({ title: 'Error', description: 'Please select a clinic first', variant: 'destructive' });
      return;
    }

    if (!selectedVendor || !selectedPharmacy || !reportMonth || !uploadFile) {
      toast({ title: 'Missing Information', description: 'Please select vendor, pharmacy, month, and upload file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const excelData = await parseFile(uploadFile) as any[];
      
      let dataStartIndex = -1;
      let headers = [];
      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];
        const lowerCaseRow = row.map((cell: any) => String(cell).toLowerCase());
        
        if (lowerCaseRow.includes('patient id') || lowerCaseRow.includes('patient initals')) {
          headers = lowerCaseRow;
          dataStartIndex = i + 1;
          break;
        }
      }

      if (dataStartIndex === -1) {
        throw new Error('Could not find header row with "Patient ID" or "Patient Initals" in the file.');
      }
      
      const patientIdIndex = headers.indexOf('patient id');
      const patientInitalsIndex = headers.indexOf('patient initals');
      const netSalesIndex = headers.indexOf('net sales');
      
      const patientRecords: any[] = [];
      for (let i = dataStartIndex; i < excelData.length; i++) {
        const row = excelData[i];
        if (!row || row.length === 0 || !row[patientIdIndex]) continue;

        const kNumber = String(row[patientIdIndex]).trim();
        const patientInitials = String(row[patientInitalsIndex] || '').trim();
        const netSales = parseFloat(row[netSalesIndex] || 0);

        if (!kNumber) continue;

        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .eq('clinic_id', selectedClinic.id)
          .eq('k_number', kNumber)
          .maybeSingle();

        let patientId = existingPatient?.id;

        if (!patientId) {
          const nameParts = patientInitials.replace(/\./g, '').split(' ');
          const firstName = nameParts[0] || 'Unknown';
          const lastName = nameParts.slice(1).join(' ') || '';

          const { data: newPatient, error: patientError } = await supabase
            .from('patients')
            .insert({
              clinic_id: selectedClinic.id,
              first_name: firstName,
              last_name: lastName,
              k_number: kNumber,
              prescription_status: 'active',
              patient_type: 'Veteran',
              vendor_id: selectedVendor,
              preferred_vendor_id: selectedVendor,
            } as any)
            .select()
            .single();

          if (patientError) throw patientError;
          patientId = newPatient.id;
        }
        
        patientRecords.push({
          pharmacy_id: selectedPharmacy,
          clinic_id: selectedClinic.id,
          patient_id: patientId,
          report_month: reportMonth + '-01',
          product_name: 'Medical Cannabis',
          grams_sold: 0,
          amount: netSales,
        });
      }

      if (patientRecords.length > 0) {
        const { error: reportsError } = await supabase
          .from('pharmacy_reports')
          .insert(patientRecords);

        if (reportsError) throw reportsError;
      }

      toast({
        title: 'Success',
        description: `Uploaded ${patientRecords.length} pharmacy sales records.`,
      });

      setSelectedVendor('');
      setReportMonth('');
      setUploadFile(null);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to process the pharmacy report.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Pharmacy Report</h1>
        <p className="text-muted-foreground">Upload monthly pharmacy sales reports</p>
      </div>

      {!user && (
        <Card>
          <CardHeader>
            <CardTitle>Preview mode</CardTitle>
            <CardDescription>Sign in to enable data and uploads.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/auth"><Button>Go to Login</Button></a>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Monthly Pharmacy Report
          </CardTitle>
          <CardDescription>
            Upload Excel or CSV reports showing patient purchases from pharmacy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pharmacy">Select Pharmacy</Label>
              <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
                <SelectTrigger id="pharmacy">
                  <SelectValue placeholder="Choose pharmacy..." />
                </SelectTrigger>
                <SelectContent>
                  {pharmacies.map((pharmacy) => (
                    <SelectItem key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">Select Vendor</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger id="vendor">
                  <SelectValue placeholder="Choose vendor..." />
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

            <div className="space-y-2">
              <Label htmlFor="month">Report Month</Label>
              <Input
                id="month"
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload Excel or CSV File</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {uploadFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  {uploadFile.name}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleUpload}
              disabled={!selectedVendor || !selectedPharmacy || !reportMonth || !uploadFile || uploading || !user}
              className="w-full"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Format Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Your file should contain columns with headers like:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>`Patient ID` (used as K-Number)</li>
            <li>`Patient Initals`</li>
            <li>`Gross sales`, `Excise`, `Net Sales`</li>
            <li>One row per patient purchase summary</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}