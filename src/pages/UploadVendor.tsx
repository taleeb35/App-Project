import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Building2, CheckCircle, AlertCircle, FileSpreadsheet, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function UploadVendor() {
  const [selectedVendor, setSelectedVendor] = useState("");
  const [reportMonth, setReportMonth] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();

  const vendors = [
    { id: "green-valley", name: "Green Valley Producers", type: "Cannabis Producer" },
    { id: "westside", name: "Westside Cannabis Clinic", type: "Producer/Dispensary" },
    { id: "central-pharmacy", name: "Central Pharmacy", type: "Pharmacy" },
    { id: "mountain-view", name: "Mountain View Cannabis", type: "Cannabis Producer" },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedVendor || !reportMonth) return;

    setUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadResult({
            vendor: vendors.find(v => v.id === selectedVendor)?.name,
            month: reportMonth,
            totalRecords: 324,
            matchedPatients: 318,
            newPatients: 6,
            exceptions: 2,
            revenue: 125420.50,
          });
          setUploading(false);
          toast({
            title: "Upload Complete",
            description: "Vendor report has been successfully processed.",
          });
          return 100;
        }
        return prev + 8;
      });
    }, 250);
  };

  const requiredFields = [
    "Patient Name (Full Name)",
    "K Number (Insurance ID)",
    "Purchase Date",
    "Product Name/Description",
    "Quantity (grams)",
    "Unit Price",
    "Total Amount",
    "Transaction ID"
  ];

  const formatGuidelines = [
    "Excel (.xlsx) or CSV (.csv) format only",
    "One transaction per row",
    "Purchase Date format: YYYY-MM-DD",
    "Amounts in decimal format (e.g., 25.50)",
    "Patient names must match clinic records",
    "Include all transactions for the month"
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Vendor Reports</h1>
        <p className="text-muted-foreground">Import monthly sales reports from producers and dispensaries</p>
      </div>

      {/* Vendor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Report Details
          </CardTitle>
          <CardDescription>Select vendor and reporting period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendor">Select Vendor</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{vendor.name}</span>
                        <Badge variant="outline" className="ml-2">{vendor.type}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month">Report Month</Label>
              <Select value={reportMonth} onValueChange={setReportMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-11">November 2024</SelectItem>
                  <SelectItem value="2024-10">October 2024</SelectItem>
                  <SelectItem value="2024-09">September 2024</SelectItem>
                  <SelectItem value="2024-08">August 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Format Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Data Format Requirements
          </CardTitle>
          <CardDescription>Ensure your vendor report meets these requirements</CardDescription>
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
            Upload Report File
          </CardTitle>
          <CardDescription>Select your vendor report file</CardDescription>
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
                <span>Processing vendor report...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <Button 
            onClick={handleUpload}
            disabled={!uploadFile || !selectedVendor || !reportMonth || uploading}
            className="w-full"
          >
            {uploading ? (
              <>Processing Report...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Vendor Report
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
              Processing Results
            </CardTitle>
            <CardDescription>Summary of vendor report import for {uploadResult.vendor}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <FileSpreadsheet className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">{uploadResult.totalRecords}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-success">{uploadResult.matchedPatients}</p>
                <p className="text-sm text-muted-foreground">Matched Patients</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <Building2 className="h-8 w-8 text-accent mx-auto mb-2" />
                <p className="text-2xl font-bold text-accent">${uploadResult.revenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
              <div className="text-center p-4 bg-warning/10 rounded-lg">
                <AlertCircle className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold text-warning">{uploadResult.exceptions}</p>
                <p className="text-sm text-muted-foreground">Exceptions Found</p>
              </div>
            </div>

            {uploadResult.exceptions > 0 && (
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning font-medium">
                  {uploadResult.exceptions} exceptions were found that require manual review.
                  Please check the Exception Handling section for details.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Recent Vendor Uploads
          </CardTitle>
          <CardDescription>History of recent vendor report uploads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { 
                vendor: "Green Valley Producers", 
                month: "October 2024", 
                uploaded: "2024-11-01", 
                records: 318, 
                revenue: 128350.75, 
                status: "Processed" 
              },
              { 
                vendor: "Westside Cannabis", 
                month: "October 2024", 
                uploaded: "2024-11-02", 
                records: 186, 
                revenue: 76420.50, 
                status: "Processed" 
              },
              { 
                vendor: "Central Pharmacy", 
                month: "October 2024", 
                uploaded: "2024-11-03", 
                records: 89, 
                revenue: 14230.25, 
                status: "Processed" 
              },
            ].map((upload, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{upload.vendor}</p>
                  <p className="text-sm text-muted-foreground">{upload.month} • Uploaded {upload.uploaded}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{upload.records} records • ${upload.revenue.toLocaleString()}</p>
                  <Badge variant="default">{upload.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}