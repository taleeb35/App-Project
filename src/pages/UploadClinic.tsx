import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UploadClinic() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Simulate processing results
          setUploadResult({
            totalRecords: 1247,
            newPatients: 15,
            updatedPatients: 1232,
            duplicatesFound: 3,
            errors: 0,
          });
          setUploading(false);
          toast({
            title: "Upload Complete",
            description: "Clinic patient data has been successfully imported.",
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const requiredFields = [
    "Patient Name",
    "Date of Birth", 
    "K Number (Insurance ID)",
    "Phone Number",
    "Email Address",
    "Active Prescription Status",
    "Assigned Producer(s)"
  ];

  const formatGuidelines = [
    "Excel (.xlsx) or CSV (.csv) format only",
    "First row must contain column headers",
    "Date of Birth format: YYYY-MM-DD",
    "K Number format: K followed by 9 digits",
    "Phone format: (XXX) XXX-XXXX",
    "Multiple producers separated by semicolon"
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Clinic Patient Data</h1>
        <p className="text-muted-foreground">Import monthly clinic patient lists</p>
      </div>

      {/* Data Format Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Data Format Requirements
          </CardTitle>
          <CardDescription>Ensure your file meets these requirements before uploading</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-foreground">Required Fields</h4>
              <ul className="space-y-2">
                {requiredFields.map((field, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">{field}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-foreground">Format Guidelines</h4>
              <ul className="space-y-2">
                {formatGuidelines.map((guideline, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <span className="text-sm">{guideline}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Patient File
          </CardTitle>
          <CardDescription>Select your clinic patient data file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          {uploadFile && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{uploadFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Badge variant="secondary">Ready to upload</Badge>
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading and processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <Button 
            onClick={handleUpload}
            disabled={!uploadFile || uploading}
            className="w-full"
          >
            {uploading ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Patient Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Upload Results
            </CardTitle>
            <CardDescription>Summary of imported patient data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">{uploadResult.totalRecords}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-success">{uploadResult.newPatients}</p>
                <p className="text-sm text-muted-foreground">New Patients</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <Calendar className="h-8 w-8 text-accent mx-auto mb-2" />
                <p className="text-2xl font-bold text-accent">{uploadResult.updatedPatients}</p>
                <p className="text-sm text-muted-foreground">Updated Records</p>
              </div>
              <div className="text-center p-4 bg-warning/10 rounded-lg">
                <AlertCircle className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold text-warning">{uploadResult.duplicatesFound}</p>
                <p className="text-sm text-muted-foreground">Duplicates Found</p>
              </div>
            </div>

            {uploadResult.duplicatesFound > 0 && (
              <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning font-medium">
                  {uploadResult.duplicatesFound} duplicate records were found and automatically merged.
                  Please review the exception handling section for details.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>History of recent patient data uploads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "2024-11-15", records: 1247, status: "Success", clinic: "Downtown Medical Center" },
              { date: "2024-10-15", records: 1235, status: "Success", clinic: "Downtown Medical Center" },
              { date: "2024-09-15", records: 1220, status: "Success", clinic: "Downtown Medical Center" },
            ].map((upload, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{upload.clinic}</p>
                  <p className="text-sm text-muted-foreground">{upload.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{upload.records} records</p>
                  <Badge variant={upload.status === 'Success' ? 'default' : 'destructive'}>
                    {upload.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}