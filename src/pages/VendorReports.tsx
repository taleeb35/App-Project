import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VendorReports() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendor Reports</h1>
        <p className="text-muted-foreground">Manage vendor reports and uploads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/vendors/upload')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              Upload Vendor Report
            </CardTitle>
            <CardDescription>
              Upload monthly Excel reports from vendors showing patient purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/vendors/upload')}>
              <FileUp className="mr-2 h-4 w-4" />
              Go to Upload
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/vendors/reports-view')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              View Vendor Reports
            </CardTitle>
            <CardDescription>
              Search, filter, and analyze uploaded vendor reports by month and vendor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/vendors/reports-view')}>
              <FileText className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold">Vendor Provides Physical Report</h3>
              <p className="text-sm text-muted-foreground">
                Each vendor provides a monthly Excel report showing which patients purchased medicine from them
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold">Admin Uploads Report</h3>
              <p className="text-sm text-muted-foreground">
                Admin selects the vendor, month, and uploads the Excel file. The system automatically creates patient records if needed
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold">View & Analyze Reports</h3>
              <p className="text-sm text-muted-foreground">
                Reports can be filtered by month, vendor, or patient. Track total grams sold and revenue over time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
