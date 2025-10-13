import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useClinic } from "@/contexts/ClinicContext";
import * as XLSX from 'xlsx';

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
}

export default function UploadClinic() {
  const { toast } = useToast();
  const { selectedClinic } = useClinic();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      setUploadResults(null);
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
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as PatientRow[];
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
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

    setIsUploading(true);
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;

    try {
      const rows = await parseExcelFile(file);
      
      if (rows.length === 0) {
        toast({
          title: "Empty file",
          description: "The Excel file contains no data",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Helpers for robust parsing
      const normalizeKey = (key: string) => key?.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizeRow = (row: Record<string, unknown>) => {
        const map: Record<string, unknown> = {};
        Object.entries(row || {}).forEach(([k, v]) => {
          if (!k) return;
          map[normalizeKey(k)] = v as any;
        });
        return map;
      };
      const parseName = (fullName: string): { firstName: string; lastName: string } => {
        const parts = (fullName || '').trim().split(' ');
        if (parts.length === 1) return { firstName: parts[0] || '', lastName: '' };
        return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
      };
      const parseDate = (dateStr: string | number): string | null => {
        if (dateStr === undefined || dateStr === null || (dateStr as any) === '') return null;
        try {
          if (typeof dateStr === 'number') {
            const d = XLSX.SSF.parse_date_code(dateStr as number);
            return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
          }
          const parsed = new Date(dateStr as string);
          if (isNaN(parsed.getTime())) return null;
          return parsed.toISOString().split('T')[0];
        } catch {
          return null;
        }
      };

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const originalRow = rows[i];
        
        try {
          // Normalize and map headers
          const map = normalizeRow(originalRow as any);
          const rowNum = i + 2;

          const fullNameRaw = (map['name'] ?? map['patientname'] ?? map['fullname'] ?? '') as string;
          const hasFirstLast = map['firstname'] && map['lastname'];
          const kNumber = (map['knumber'] ?? map['kid'] ?? map['kno']) as string | undefined;

          if (!fullNameRaw && !hasFirstLast) {
            errors.push(`Row ${rowNum}: Missing name`);
            failed++;
            continue;
          }
          if (!kNumber) {
            errors.push(`Row ${rowNum}: Missing K Number`);
            failed++;
            continue;
          }

          const { firstName, lastName } = hasFirstLast
            ? { firstName: String(map['firstname'] || '').trim(), lastName: String(map['lastname'] || '').trim() }
            : parseName(String(fullNameRaw));

          const dobRaw = (map['dob'] ?? map['dateofbirth']) as string | number | undefined;
          const dateOfBirth = dobRaw !== undefined ? parseDate(dobRaw) : null;

          const phone = map['phone'] ? String(map['phone']).trim() : null;
          const email = map['email'] ? String(map['email']).trim() : null;

          const rxStatusRaw = String(map['prescriptionstatus'] ?? map['status'] ?? 'active').toLowerCase();
          const patientStatus = rxStatusRaw === 'inactive' ? 'inactive' : 'active';

          const typeRaw = String(map['type'] ?? 'Veterans').trim();
          const isVeteran = typeRaw.toLowerCase() === 'veterans';

          // Duplicate check by K Number within clinic
          const { data: existingPatients, error: checkError } = await (supabase as any)
            .from('patients')
            .select('id')
            .eq('clinic_id', selectedClinic.id)
            .eq('k_number', String(kNumber).trim());
          if (checkError) throw checkError;

          // Parse vendor names from a variety of possible headers
          const vendorsCell = (
            map['vendors'] ??
            map['vendor'] ??
            map['assignedvendors'] ??
            map['assignedvendor'] ??
            map['dispensary'] ??
            map['dispensaries'] ??
            map['pharmacy'] ??
            ''
          ) as string | undefined;

          const vendorsRaw = vendorsCell ? String(vendorsCell).trim() : '';

          // Resolve vendor IDs for this clinic (fuzzy match, suffix cleanup)
          let vendorIds: string[] = [];
          if (vendorsRaw) {
            const normalizedListStr = String(vendorsRaw).replace(/&/g, ',');
            const vendorNames = normalizedListStr
              .split(/[;,|\/\n]+/)
              .map((v) => v.replace(/^[\"']|[\"']$/g, '').trim())
              .filter((v) => v.length > 0);

            for (const originalName of vendorNames) {
              const vendorName = originalName.trim();
              
              let vendorMatchId: string | null = null;

              // First try exact match (case-insensitive)
              const { data: exactMatch } = await (supabase as any)
                .from('vendors')
                .select('id')
                .eq('clinic_id', selectedClinic.id)
                .ilike('name', vendorName)
                .limit(1)
                .maybeSingle();
              
              if (exactMatch?.id) {
                vendorMatchId = exactMatch.id;
              } else {
                // Then try partial match
                const { data: partialMatch } = await (supabase as any)
                  .from('vendors')
                  .select('id')
                  .eq('clinic_id', selectedClinic.id)
                  .ilike('name', `%${vendorName}%`)
                  .limit(1)
                  .maybeSingle();
                if (partialMatch?.id) {
                  vendorMatchId = partialMatch.id;
                }
              }

              // Auto-create vendor if not found (then map)
              if (!vendorMatchId) {
                const { data: createdVendor, error: createVendorError } = await (supabase as any)
                  .from('vendors')
                  .insert({
                    clinic_id: selectedClinic.id,
                    name: vendorName.trim(),
                    status: 'active',
                  } as any)
                  .select('id')
                  .single();
                if (!createVendorError && createdVendor?.id) {
                  vendorMatchId = createdVendor.id;
                }
              }

              if (vendorMatchId) vendorIds.push(vendorMatchId);
            }
            vendorIds = Array.from(new Set(vendorIds));
          }

          let patientId: string | null = null;

          if (existingPatients && existingPatients.length > 0) {
            // Use existing patient and proceed to vendor mapping (do not treat as failure)
            patientId = existingPatients[0].id;
          } else {
            // Insert new patient (set preferred vendor to first match when available)
            const { data: newPatient, error } = await (supabase as any)
              .from('patients')
              .insert({
                clinic_id: selectedClinic.id,
                first_name: firstName,
                last_name: lastName,
                k_number: String(kNumber).trim(),
                date_of_birth: dateOfBirth,
                phone,
                email,
                prescription_status: rxStatusRaw,
                status: patientStatus,
                patient_type: isVeteran ? 'Veteran' : 'Civilian',
                preferred_vendor_id: vendorIds[0] || null,
              } as any)
              .select('id')
              .single();

            if (error) {
              errors.push(`Row ${rowNum}: ${error.message}`);
              failed++;
              continue;
            }
            patientId = newPatient.id;
            successful++;
          }

          // Link vendors for both new and existing patients
          if (patientId && vendorIds.length > 0) {
            const { data: existingLinks } = await (supabase as any)
              .from('patient_vendors')
              .select('vendor_id')
              .eq('patient_id', patientId);

            const existingSet = new Set((existingLinks || []).map((l: any) => l.vendor_id));
            const newLinks = vendorIds
              .filter((id) => !existingSet.has(id))
              .map((id) => ({ patient_id: patientId, vendor_id: id }));

            if (newLinks.length > 0) {
              const { error: junctionError } = await (supabase as any)
                .from('patient_vendors')
                .insert(newLinks);
              if (junctionError) {
                console.error(`Failed to link vendors for patient ${patientId}:`, junctionError);
                // Do not mark as failed, continue processing
              }
            }

            // Ensure preferred vendor is set if missing
            const { data: prefCheck } = await (supabase as any)
              .from('patients')
              .select('preferred_vendor_id')
              .eq('id', patientId)
              .single();
            if (!prefCheck?.preferred_vendor_id && vendorIds[0]) {
              await (supabase as any)
                .from('patients')
                .update({ preferred_vendor_id: vendorIds[0] })
                .eq('id', patientId);
            }
          }
        } catch (error: any) {
          errors.push(`Row ${i + 2}: ${error.message}`);
          failed++;
        }
      }

      setUploadResults({
        total: rows.length,
        successful,
        failed,
        errors: errors.slice(0, 10), // Show first 10 errors
      });

      // Create upload record
      await supabase.from('data_uploads' as any).insert({
        clinic_id: selectedClinic.id,
        file_name: file.name,
        upload_type: 'clinic',
        records_count: successful,
        status: failed > 0 ? 'completed_with_errors' : 'completed',
      } as any);

      toast({
        title: "Upload completed",
        description: `Successfully imported ${successful} patients${failed > 0 ? ` (${failed} failed)` : ''}`,
      });

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Patient Data</h1>
        <p className="text-muted-foreground">Import patient records from Excel file</p>
      </div>

      {!selectedClinic && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a clinic from the top header before uploading patient data.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Excel File Upload
          </CardTitle>
          <CardDescription>
            Upload an Excel file (.xlsx or .xls) containing patient information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select Excel File</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isUploading || !selectedClinic}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Excel file should contain these columns:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Name</strong> – Patient full name (required)</li>
                <li><strong>DOB</strong> – Date of birth in YYYY-MM-DD format (required)</li>
                <li><strong>K Number</strong> – Patient identification number (required)</li>
                <li><strong>Phone</strong> – Contact phone number (optional)</li>
                <li><strong>Email</strong> – Email address (optional)</li>
                <li><strong>Prescription Status</strong> – "active" or "inactive" (optional, defaults to "active")</li>
                <li><strong>Vendors</strong> – Single vendor or multiple vendors separated by commas (optional)</li>
                <li><strong>Type</strong> – "Veterans" or "Civilians" (optional, defaults to "Veterans")</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading || !selectedClinic}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Patient Data
              </>
            )}
          </Button>

          {uploadResults && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Rows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{uploadResults.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-success">Successful</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-success">{uploadResults.successful}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-destructive">Failed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-destructive">{uploadResults.failed}</p>
                  </CardContent>
                </Card>
              </div>

              {uploadResults.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Errors encountered:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {uploadResults.errors.map((error, idx) => (
                        <li key={idx} className="text-sm">{error}</li>
                      ))}
                      {uploadResults.errors.length === 10 && uploadResults.failed > 10 && (
                        <li className="text-sm italic">... and {uploadResults.failed - 10} more errors</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
