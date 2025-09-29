import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Pill, CheckCircle, AlertCircle, FileSpreadsheet, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function UploadPharmacy() {
  const [selectedPharmacy, setSelectedPharmacy] = useState("");
  const [reportMonth, setReportMonth] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();

  const pharmacies = [
    { id: "central-pharmacy", name: "Central Pharmacy", location: "Downtown" },
    { id: "westside-pharmacy", name: "Westside Pharmacy", location: "West District" },
    { id: "northpoint-pharmacy", name: "Northpoint Pharmacy", location: "North End" },
    { id: "riverside-pharmacy", name: "Riverside Pharmacy", location: "Riverside" },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedPharmacy || !reportMonth) return;

    setUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadResult({
            pharmacy: pharmacies.find(p => p.id === selectedPharmacy)?.name,
            month: reportMonth,
            totalPrescriptions: 89,
            matchedPatients: 87,
            newPatients: 0,
            exceptions: 2,
            totalDispensed: 15230.75,
            prescriptionTypes: 8,
          });
          setUploading(false);
          toast({
            title: "Upload Complete",
            description: "Pharmacy report has been successfully processed.",
          });
          return 100;
        }
        return prev + 7;
      });
    }, 300);
  };

  const requiredFields = [
    "Patient Name (Full Name)",
    "K Number (Insurance ID)",
    "Prescription Number",
    "Medication Name",
    "Dosage/Strength",
    "Quantity Dispensed",
    "Dispense Date",
    "Prescribing Physician",
    "Cost to Patient"
  ];

  const formatGuidelines = [
    "Excel (.xlsx) or CSV (.csv) format only",
    "One prescription per row",
    "Dispense Date format: YYYY-MM-DD",
    "Dosage in standard format (e.g., 5mg, 10ml)",
    "Patient names must match clinic records",
    "Include all dispensed prescriptions for the month",
    "Cost amounts in decimal format (e.g., 85.50)"
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Pharmacy Data</h1>
        <p className="text-muted-foreground">Import monthly prescription dispensing reports from pharmacies</p>
      </div>

      {/* Pharmacy Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Report Details
          </CardTitle>
          <CardDescription>Select pharmacy and reporting period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pharmacy">Select Pharmacy</Label>
              <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose pharmacy..." />
                </SelectTrigger>
                <SelectContent>
                  {pharmacies.map((pharmacy) => (
                    <SelectItem key={pharmacy.id} value={pharmacy.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{pharmacy.name}</span>
                        <Badge variant="outline" className="ml-2">{pharmacy.location}</Badge>
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
          <CardDescription>Ensure your pharmacy report meets these requirements</CardDescription>
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
            Upload Prescription Data
          </CardTitle>
          <CardDescription>Select your pharmacy dispensing report</CardDescription>
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
                <span>Processing pharmacy data...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <Button 
            onClick={handleUpload}
            disabled={!uploadFile || !selectedPharmacy || !reportMonth || uploading}
            className="w-full"
          >
            {uploading ? (
              <>Processing Data...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Pharmacy Data
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
            <CardDescription>Summary of pharmacy data import for {uploadResult.pharmacy}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <Pill className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">{uploadResult.totalPrescriptions}</p>
                <p className="text-sm text-muted-foreground">Prescriptions</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-success">{uploadResult.matchedPatients}</p>
                <p className="text-sm text-muted-foreground">Matched Patients</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <span className="text-2xl mx-auto mb-2 block">$</span>
                <p className="text-2xl font-bold text-accent">${uploadResult.totalDispensed.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Dispensed</p>
              </div>
              <div className="text-center p-4 bg-warning/10 rounded-lg">
                <AlertCircle className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold text-warning">{uploadResult.exceptions}</p>
                <p className="text-sm text-muted-foreground">Exceptions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Prescription Types</p>
                <p className="text-lg font-semibold">{uploadResult.prescriptionTypes} different medications</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Average Cost per Prescription</p>
                <p className="text-lg font-semibold">${(uploadResult.totalDispensed / uploadResult.totalPrescriptions).toFixed(2)}</p>
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
            Recent Pharmacy Uploads
          </CardTitle>
          <CardDescription>History of recent pharmacy data uploads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { 
                pharmacy: "Central Pharmacy", 
                month: "October 2024", 
                uploaded: "2024-11-05", 
                prescriptions: 87, 
                dispensed: 14230.25, 
                status: "Processed" 
              },
              { 
                pharmacy: "Westside Pharmacy", 
                month: "October 2024", 
                uploaded: "2024-11-06", 
                prescriptions: 45, 
                dispensed: 7850.50, 
                status: "Processed" 
              },
              { 
                pharmacy: "Northpoint Pharmacy", 
                month: "October 2024", 
                uploaded: "2024-11-07", 
                prescriptions: 62, 
                dispensed: 10420.75, 
                status: "Processed" 
              },
            ].map((upload, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{upload.pharmacy}</p>
                  <p className="text-sm text-muted-foreground">{upload.month} • Uploaded {upload.uploaded}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{upload.prescriptions} prescriptions • ${upload.dispensed.toLocaleString()}</p>
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