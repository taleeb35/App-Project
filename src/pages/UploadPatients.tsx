import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';
import * as XLSX from 'xlsx';
import { AdminLayout } from '@/components/layout/AdminLayout';

interface PatientRow {
  name?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  dob?: string;
  k_number?: string;
  phone?: string;
  email?: string;
  prescription_status?: string;
  status?: string;
  is_veteran?: string | boolean;
}

export default function UploadPatients() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    added: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();
  const { selectedClinic } = useClinic();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const parseExcelFile = async (file: File): Promise<PatientRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<PatientRow>(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const parseName = (fullName: string): { firstName: string; lastName: string } => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  };

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    try {
      // Handle Excel serial date or string date
      if (typeof dateStr === 'number') {
        const date = XLSX.SSF.parse_date_code(dateStr);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
      // Handle string date format YYYY-MM-DD or similar
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!selectedClinic) {
      toast({
        title: "No clinic selected",
        description: "Please select a clinic first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const errors: string[] = [];
    let addedCount = 0;
    let skippedCount = 0;

    try {
      const rows = await parseExcelFile(file);
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Excel row number (accounting for header)

        try {
          // Handle different column name formats
          const fullName = row.name || (row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : '');
          const patientNumber = row.k_number?.toString().trim();
          
          if (!fullName || !patientNumber) {
            errors.push(`Row ${rowNum}: Missing required fields (name and k_number)`);
            continue;
          }

          const { firstName, lastName } = row.first_name && row.last_name 
            ? { firstName: row.first_name, lastName: row.last_name }
            : parseName(fullName);
          
          const dobValue = row.date_of_birth || row.dob;
          const dob = dobValue ? parseDate(dobValue.toString()) : null;

          // Check for duplicate based on patient_number and clinic
          const { data: existingPatients, error: checkError } = await supabase
            .from('patients')
            .select('id')
            .eq('clinic_id', selectedClinic.id)
            .eq('patient_number', patientNumber);

          if (checkError) throw checkError;

          if (existingPatients && existingPatients.length > 0) {
            skippedCount++;
            continue; // Skip duplicate
          }

          // Insert new patient
          const { error: insertError } = await supabase
            .from('patients')
            .insert({
              clinic_id: selectedClinic.id,
              patient_number: patientNumber,
              first_name: firstName,
              last_name: lastName,
              date_of_birth: dob,
              phone: row.phone?.toString().trim() || null,
              email: row.email?.toString().trim() || null,
              status: 'active',
            });

          if (insertError) throw insertError;

          addedCount++;
        } catch (error: any) {
          errors.push(`Row ${rowNum}: ${error.message}`);
        }
      }

      // Upload completed successfully

      setResults({
        total: rows.length,
        added: addedCount,
        skipped: skippedCount,
        errors,
      });

      toast({
        title: "Upload completed",
        description: `Added ${addedCount} patients, skipped ${skippedCount} duplicates`,
      });

      setFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Upload Patient Data</h1>
        <p className="text-muted-foreground mb-6">Import patient records from Excel file</p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-primary">📄</span>
              Excel File Upload
            </CardTitle>
            <CardDescription>
              Upload an Excel file (.xlsx or .xls) containing patient information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Excel File</label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {file && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload Patient Data"}
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Excel file should contain these columns:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong>name</strong> (or first_name + last_name) - Patient full name</li>
              <li><strong>date_of_birth</strong> (or dob) - Date of birth</li>
              <li><strong>k_number</strong> - Insurance ID for Veterans</li>
              <li><strong>phone</strong> - Contact phone (optional)</li>
              <li><strong>email</strong> - Email address (optional)</li>
              <li><strong>prescription_status</strong> (or status) - Active prescription status (optional, defaults to "active")</li>
            </ul>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Total rows processed:</strong> {results.total}</p>
                <p className="text-green-600"><strong>New patients added:</strong> {results.added}</p>
                <p className="text-yellow-600"><strong>Duplicates skipped:</strong> {results.skipped}</p>
                
                {results.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-red-600 font-semibold mb-2">Errors:</p>
                    <div className="bg-red-50 p-4 rounded-md max-h-60 overflow-y-auto">
                      {results.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-700">{error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
