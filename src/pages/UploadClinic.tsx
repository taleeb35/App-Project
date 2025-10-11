import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
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

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        try {
          // Parse name field (could be "First Last" or separate fields)
          let firstName = row.first_name || '';
          let lastName = row.last_name || '';
          
          if (row.name && !firstName && !lastName) {
            const nameParts = row.name.trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }

          // Validate required fields
          if (!firstName || !lastName) {
            errors.push(`Row ${i + 2}: Missing name`);
            failed++;
            continue;
          }

          if (!row.k_number) {
            errors.push(`Row ${i + 2}: Missing K Number`);
            failed++;
            continue;
          }

          // Parse date of birth
          const dobField = row.date_of_birth || row.dob;
          let dateOfBirth = null;
          
          if (dobField) {
            // Handle Excel date serial number
            if (typeof dobField === 'number') {
              const excelEpoch = new Date(1899, 11, 30);
              const date = new Date(excelEpoch.getTime() + dobField * 86400000);
              dateOfBirth = date.toISOString().split('T')[0];
            } else {
              // Try to parse as string
              const parsed = new Date(dobField);
              if (!isNaN(parsed.getTime())) {
                dateOfBirth = parsed.toISOString().split('T')[0];
              }
            }
          }

          // Insert patient
          const { error } = await supabase
            .from('patients')
            .insert({
              clinic_id: selectedClinic.id,
              first_name: firstName,
              last_name: lastName,
              k_number: row.k_number,
              date_of_birth: dateOfBirth,
              phone: row.phone || null,
              email: row.email || null,
              prescription_status: row.prescription_status || row.status || 'active',
              status: 'active',
            } as any);

          if (error) {
            errors.push(`Row ${i + 2}: ${error.message}`);
            failed++;
          } else {
            successful++;
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
                <li><strong>name</strong> (or first_name + last_name) - Patient full name</li>
                <li><strong>date_of_birth</strong> (or dob) - Date of birth</li>
                <li><strong>k_number</strong> - Insurance ID for Veterans</li>
                <li><strong>phone</strong> - Contact phone (optional)</li>
                <li><strong>email</strong> - Email address (optional)</li>
                <li><strong>prescription_status</strong> (or status) - Active prescription status (optional, defaults to "active")</li>
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
