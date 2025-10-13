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
  // Lowercase/underscore variants
  name?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string | number;
  dob?: string | number;
  k_number?: string;
  phone?: string;
  email?: string;
  prescription_status?: string;
  status?: string;
  vendors?: string;
  type?: string;
  // Exact headers from sample sheet (Title Case)
  Name?: string;
  DOB?: string | number;
  'K Number'?: string;
  Phone?: string;
  Email?: string;
  'Prescription Status'?: string;
  Vendors?: string;
  Type?: string;
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

const parseDate = (dateStr: string | number): string | null => {
  if (dateStr === undefined || dateStr === null || (dateStr as any) === '') return null;
  try {
    // Handle Excel serial date or string date
    if (typeof dateStr === 'number') {
      const date = XLSX.SSF.parse_date_code(dateStr);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    // Handle string date format YYYY-MM-DD or similar
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

// Normalize header keys from Excel to be resilient to casing, spaces and symbols
const normalizeKey = (key: string) =>
  key?.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const normalizeRow = (row: Record<string, unknown>) => {
  const map: Record<string, unknown> = {};
  Object.entries(row).forEach(([k, v]) => {
    if (!k) return;
    map[normalizeKey(k)] = v;
  });
  return map;
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
          // Normalize and map from flexible headers
          const map = normalizeRow(row as any);

          const fullNameRaw = (map['name'] ?? map['patientname'] ?? map['fullname'] ?? '') as string;
          const hasFirstLast = map['firstname'] && map['lastname'];
          const kNumber = (map['knumber'] ?? map['kid'] ?? map['kno']) as string | undefined;

          if ((!fullNameRaw && !hasFirstLast) || !kNumber) {
            errors.push(`Row ${rowNum}: Missing required fields (Name and K Number)`);
            continue;
          }

          const { firstName, lastName } = hasFirstLast
            ? { firstName: String(map['firstname'] || '').trim(), lastName: String(map['lastname'] || '').trim() }
            : parseName(String(fullNameRaw));

          const dobRaw = (map['dob'] ?? map['dateofbirth']) as string | number | undefined;
          const dob = dobRaw !== undefined ? parseDate(dobRaw) : null;

          // Check for existing patient by k_number within clinic
          const { data: existingPatients, error: checkError } = await (supabase as any)
            .from('patients')
            .select('id')
            .eq('clinic_id', selectedClinic.id)
            .eq('k_number', String(kNumber).trim());
          if (checkError) throw checkError;

          let patientId: string | null = null;

          // Map prescription status to patient.status
          const rxStatusRaw = String(map['prescriptionstatus'] ?? map['status'] ?? 'active').toLowerCase();
          const patientStatus = rxStatusRaw === 'inactive' ? 'inactive' : 'active';

          const phone = map['phone'] ? String(map['phone']).trim() : null;
          const email = map['email'] ? String(map['email']).trim() : null;

          const typeRaw = String(map['type'] ?? 'Veterans').trim();
          const isVeteran = typeRaw.toLowerCase() === 'veterans';

          if (existingPatients && existingPatients.length > 0) {
            // Use existing patient; still process vendor mapping
            patientId = existingPatients[0].id;
            skippedCount++;
          } else {
            // Insert new patient
            const { data: newPatient, error: insertError } = await (supabase as any)
              .from('patients')
              .insert([
                {
                  clinic_id: selectedClinic.id,
                  k_number: String(kNumber).trim(),
                  first_name: firstName,
                  last_name: lastName,
                  date_of_birth: dob,
                  phone,
                  email,
                  status: patientStatus,
                  is_veteran: isVeteran,
                } as any
              ])
              .select('id')
              .single();
            if (insertError) throw insertError;
            patientId = newPatient.id;
            addedCount++;
          }

          // Handle vendor associations from 'Vendors' column for both new and existing patients
          const vendorsRaw = map['vendors'] ? String(map['vendors']).trim() : '';
          if (vendorsRaw && patientId) {
            const vendorNames = vendorsRaw.split(',').map(v => v.trim()).filter(v => v.length > 0);
            let vendorIds: string[] = [];
            for (const vendorName of vendorNames) {
              const { data: vendorMatch } = await (supabase as any)
                .from('vendors')
                .select('id')
                .eq('clinic_id', selectedClinic.id)
                .ilike('name', `%${vendorName}%`)
                .limit(1)
                .maybeSingle();
              if (vendorMatch?.id) vendorIds.push(vendorMatch.id);
            }
            vendorIds = Array.from(new Set(vendorIds));
            if (vendorIds.length > 0) {
              const { data: existingLinks } = await (supabase as any)
                .from('patient_vendors')
                .select('vendor_id')
                .eq('patient_id', patientId);
              const existingSet = new Set((existingLinks || []).map((l: any) => l.vendor_id));
              const newLinks = vendorIds
                .filter((id) => !existingSet.has(id))
                .map((id) => ({ patient_id: patientId, vendor_id: id }));
              if (newLinks.length > 0) {
                const { error: linkError } = await (supabase as any)
                  .from('patient_vendors')
                  .insert(newLinks);
                if (linkError) {
                  console.error('Failed to link vendors for patient', patientId, linkError);
                }
              }
            }
          }
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
                <li><strong>Name</strong> – Patient full name (required)</li>
                <li><strong>DOB</strong> – Date of birth in YYYY-MM-DD format (required)</li>
                <li><strong>K Number</strong> – Patient identification number (required)</li>
                <li><strong>Phone</strong> – Contact phone number (optional)</li>
                <li><strong>Email</strong> – Email address (optional)</li>
                <li><strong>Prescription Status</strong> – "active" or "inactive" (optional, defaults to "active")</li>
                <li><strong>Vendors</strong> – Single vendor name or multiple vendors separated by commas (e.g., "Green Valley Dispensary, Healing Herbs Co.") (optional)</li>
                <li><strong>Type</strong> – "Veterans" or "Civilians" (optional, defaults to "Veterans")</li>
              </ul>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                  📌 Important Notes:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Column names must match exactly as shown above</li>
                  <li>Name, DOB, and K Number are required fields</li>
                  <li>For multiple vendors, separate names with commas in the Vendors column</li>
                  <li>Date format should be YYYY-MM-DD (e.g., 1965-03-15)</li>
                </ul>
              </div>
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
