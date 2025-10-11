import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileSpreadsheet, Calendar } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import * as XLSX from 'xlsx';

export default function VendorReportUpload() {
  const { toast } = useToast();
  const { selectedClinic } = useClinic();
  const [selectedVendor, setSelectedVendor] = useState('');
  const [reportMonth, setReportMonth] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);

  // Fetch vendors for the selected clinic
  useState(() => {
    if (selectedClinic) {
      fetchVendors();
    }
  });

  const fetchVendors = async () => {
    if (!selectedClinic) return;
    
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: 'Invalid File',
          description: 'Please upload an Excel file (.xlsx or .xls)',
          variant: 'destructive',
        });
        return;
      }
      setUploadFile(file);
    }
  };

  const parseExcelFile = async (file: File) => {
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
      toast({
        title: 'Error',
        description: 'Please select a clinic first',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedVendor || !reportMonth || !uploadFile) {
      toast({
        title: 'Missing Information',
        description: 'Please select vendor, month, and upload file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Parse the Excel file
      const excelData = await parseExcelFile(uploadFile) as any[];
      
      // Expected format: First few rows are headers, then patient data
      // Find where patient data starts (after "Patient Name" header)
      let dataStartIndex = -1;
      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];
        if (row.some((cell: any) => typeof cell === 'string' && cell.toLowerCase().includes('patient name'))) {
          dataStartIndex = i + 1;
          break;
        }
      }

      if (dataStartIndex === -1) {
        throw new Error('Could not find patient data in the file');
      }

      // Parse patient records from the Excel
      const patientRecords: any[] = [];
      for (let i = dataStartIndex; i < excelData.length; i++) {
        const row = excelData[i];
        if (!row || row.length === 0 || !row[0]) continue;

        const patientName = String(row[0] || '').trim();
        if (!patientName) continue;

        // Split name into first and last
        const nameParts = patientName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || nameParts[0];

        // Extract grams and amount from appropriate columns
        const grams = parseFloat(row[1] || 0);
        const amount = parseFloat(row[2] || 0);

        // First, check if patient exists
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .eq('clinic_id', selectedClinic.id)
          .ilike('first_name', firstName)
          .ilike('last_name', lastName)
          .maybeSingle();

        let patientId = existingPatient?.id;

        // If patient doesn't exist, create them
        if (!patientId) {
          const { data: newPatient, error: patientError } = await supabase
            .from('patients')
            .insert({
              clinic_id: selectedClinic.id,
              first_name: firstName,
              last_name: lastName,
              k_number: `K${Date.now()}${Math.floor(Math.random() * 1000)}`, // Generate temp K number
              prescription_status: 'active',
              is_veteran: true,
            })
            .select()
            .single();

          if (patientError) throw patientError;
          patientId = newPatient.id;
        }

        // Create vendor report record
        patientRecords.push({
          vendor_id: selectedVendor,
          clinic_id: selectedClinic.id,
          patient_id: patientId,
          report_month: reportMonth + '-01',
          product_name: 'Medical Cannabis',
          grams_sold: grams,
          amount: amount,
        });
      }

      // Insert all vendor reports
      const { error: reportsError } = await supabase
        .from('vendor_reports')
        .insert(patientRecords);

      if (reportsError) throw reportsError;

      toast({
        title: 'Success',
        description: `Uploaded ${patientRecords.length} patient records for the vendor report`,
      });

      // Reset form
      setSelectedVendor('');
      setReportMonth('');
      setUploadFile(null);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to process vendor report',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Vendor Report</h1>
        <p className="text-muted-foreground">Upload monthly vendor reports for patient medicine purchases</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Monthly Vendor Report
          </CardTitle>
          <CardDescription>
            Upload Excel reports showing patient purchases from vendors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <Label htmlFor="file">Upload Excel File</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
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
              disabled={!selectedVendor || !reportMonth || !uploadFile || uploading}
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
          <p className="text-sm text-muted-foreground">Your Excel file should contain:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Column with "Patient Name" header</li>
            <li>Column with grams/quantity data</li>
            <li>Column with amount/price data</li>
            <li>One row per patient purchase</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
