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
  Name?: string;
  DOB?: string;
  'K Number'?: string;
  Phone?: string;
  Email?: string;
  'Prescription Status'?: string;
  Vendors?: string;
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
  const { user } = useAuth();
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
          if (!row.Name || !row['K Number']) {
            errors.push(`Row ${rowNum}: Missing required fields (Name or K Number)`);
            continue;
          }

          const { firstName, lastName } = parseName(row.Name);
          const kNumber = row['K Number'].toString().trim();
          const dob = row.DOB ? parseDate(row.DOB.toString()) : null;

          // Check for duplicate based on K number (patient_number) and name
          const { data: existingPatients, error: checkError } = await supabase
            .from('patients')
            .select('id')
            .eq('clinic_id', selectedClinic.id)
            .eq('patient_number', kNumber)
            .eq('first_name', firstName)
            .eq('last_name', lastName);

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
              patient_number: kNumber,
              first_name: firstName,
              last_name: lastName,
              date_of_birth: dob,
              phone: row.Phone?.toString().trim() || null,
              email: row.Email?.toString().trim() || null,
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
        <h1 className="text-3xl font-bold mb-6">Upload Patients List</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Excel File</CardTitle>
            <CardDescription>
              Upload an Excel file containing patient information. The system will automatically skip duplicates based on K Number and Name.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
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
              {uploading ? "Uploading..." : "Upload Patients"}
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Required Excel Format</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your Excel file should contain the following columns:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong>Name</strong> (Required) - Full name of the patient</li>
              <li><strong>DOB</strong> - Date of birth (format: YYYY-MM-DD or Excel date)</li>
              <li><strong>K Number</strong> (Required) - Unique patient identifier</li>
              <li><strong>Phone</strong> - Contact phone number</li>
              <li><strong>Email</strong> - Email address</li>
              <li><strong>Prescription Status</strong> - Active or Inactive</li>
              <li><strong>Vendors</strong> - Comma-separated list of vendor names</li>
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
