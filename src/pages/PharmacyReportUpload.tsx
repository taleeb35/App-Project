import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PharmacyReportUpload() {
  const [reportMonth, setReportMonth] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!reportMonth || !uploadFile) {
      toast({
        title: "Missing Information",
        description: "Please select report month and upload file",
        variant: "destructive",
      });
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate processing
    setTimeout(() => {
      setUploadResults({
        totalRecords: 247,
        matchedPatients: 245,
        totalDispensed: 12453.50,
        exceptions: 2,
      });
      toast({
        title: "Upload Successful",
        description: "Pharmacy report has been processed successfully",
      });
    }, 2000);
  };

  const requiredFields = [
    "Patient K Number",
    "Patient Name",
    "Product Name",
    "Quantity (grams)",
    "Amount ($)",
    "Date"
  ];

  const formatGuidelines = [
    "Excel (.xlsx or .xls) format required",
    "Date format: MM/DD/YYYY",
    "Quantity must be in grams",
    "Amount must include dollar sign or be numeric",
    "Patient K Number must match existing patients in database",
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pharmacy Report Upload</h1>
        <p className="text-muted-foreground mt-2">
          Upload monthly pharmacy sales reports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>Select the report month for this pharmacy report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Report Month</Label>
            <Input
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              placeholder="Select month"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Format Requirements</CardTitle>
          <CardDescription>Your Excel file must include the following information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Required Fields</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {requiredFields.map((field, idx) => (
                <li key={idx}>{field}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Format Guidelines</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {formatGuidelines.map((guideline, idx) => (
                <li key={idx}>{guideline}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>Select and upload your pharmacy report Excel file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select File</Label>
            <div className="flex gap-2">
              <Input
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

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <Button 
            onClick={handleUpload} 
            disabled={!reportMonth || !uploadFile || uploadProgress > 0}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Pharmacy Report
          </Button>
        </CardContent>
      </Card>

      {uploadResults && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{uploadResults.totalRecords}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Matched Patients</p>
                <p className="text-2xl font-bold">{uploadResults.matchedPatients}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Dispensed</p>
                <p className="text-2xl font-bold">${uploadResults.totalDispensed.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Exceptions</p>
                <p className="text-2xl font-bold text-destructive">{uploadResults.exceptions}</p>
              </div>
            </div>

            {uploadResults.exceptions > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {uploadResults.exceptions} records could not be matched to existing patients. 
                  Please review the exceptions report.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { month: 'January 2025', date: '2025-02-01', records: 247, status: 'Completed' },
              { month: 'December 2024', date: '2025-01-05', records: 238, status: 'Completed' },
              { month: 'November 2024', date: '2024-12-03', records: 242, status: 'Completed' },
            ].map((upload, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{upload.month}</p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded on {new Date(upload.date).toLocaleDateString()} • {upload.records} records
                  </p>
                </div>
                <span className="text-sm text-green-600">{upload.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}