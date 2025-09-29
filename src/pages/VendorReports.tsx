import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Download, 
  Calendar, 
  Users, 
  DollarSign,
  TrendingUp,
  FileText,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function VendorReports() {
  const vendorReports = [
    {
      vendor: "Green Valley Producers",
      type: "Cannabis Producer",
      lastReport: "2024-11-15",
      status: "Complete",
      patients: 324,
      revenue: 125420.50,
      transactions: 1847,
      avgPerPatient: 387.10,
      growthRate: "+8.2%",
    },
    {
      vendor: "Westside Cannabis Clinic",
      type: "Producer/Dispensary", 
      lastReport: "2024-11-14",
      status: "Complete",
      patients: 198,
      revenue: 78650.25,
      transactions: 1203,
      avgPerPatient: 397.22,
      growthRate: "+12.5%",
    },
    {
      vendor: "Central Pharmacy",
      type: "Pharmacy",
      lastReport: "2024-11-15",
      status: "Complete",
      patients: 89,
      revenue: 15230.75,
      transactions: 189,
      avgPerPatient: 171.24,
      growthRate: "-2.1%",
    },
    {
      vendor: "Mountain View Cannabis",
      type: "Cannabis Producer",
      lastReport: "2024-11-10",
      status: "Overdue",
      patients: 156,
      revenue: 65420.00,
      transactions: 892,
      avgPerPatient: 419.36,
      growthRate: "+15.3%",
    },
  ];

  const summaryStats = {
    totalVendors: vendorReports.length,
    completeReports: vendorReports.filter(v => v.status === 'Complete').length,
    totalPatients: vendorReports.reduce((sum, v) => sum + v.patients, 0),
    totalRevenue: vendorReports.reduce((sum, v) => sum + v.revenue, 0),
    totalTransactions: vendorReports.reduce((sum, v) => sum + v.transactions, 0),
  };

  const monthlyTrends = [
    { month: "November 2024", reports: 3, revenue: 219301.50, patients: 611, onTime: 75 },
    { month: "October 2024", reports: 4, revenue: 284721.25, patients: 767, onTime: 100 },
    { month: "September 2024", reports: 4, revenue: 267893.75, patients: 743, onTime: 100 },
    { month: "August 2024", reports: 4, revenue: 251456.50, patients: 721, onTime: 75 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Vendor Reports</h1>
        <p className="text-muted-foreground">Comprehensive analysis of vendor performance and reporting</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summaryStats.totalVendors}</div>
            <p className="text-xs text-muted-foreground">{summaryStats.completeReports} reports complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summaryStats.totalPatients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all vendors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${summaryStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summaryStats.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Vendor Performance Summary
          </CardTitle>
          <CardDescription>Current month performance metrics for all vendors</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Last Report</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Avg/Patient</TableHead>
                <TableHead>Growth</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorReports.map((vendor, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{vendor.vendor}</p>
                      <Badge variant="outline" className="text-xs mt-1">{vendor.type}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{vendor.lastReport}</p>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={vendor.status === 'Complete' ? 'default' : 'destructive'}
                      className={vendor.status === 'Complete' ? 'bg-success text-success-foreground' : ''}
                    >
                      {vendor.status === 'Complete' ? (
                        <><CheckCircle className="h-3 w-3 mr-1" />Complete</>
                      ) : (
                        <><AlertTriangle className="h-3 w-3 mr-1" />Overdue</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{vendor.patients}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">${vendor.revenue.toLocaleString()}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{vendor.transactions.toLocaleString()}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">${vendor.avgPerPatient.toFixed(2)}</p>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={vendor.growthRate.startsWith('+') ? 'default' : 'secondary'}
                      className={vendor.growthRate.startsWith('+') ? 'bg-success text-success-foreground' : ''}
                    >
                      {vendor.growthRate.startsWith('+') ? (
                        <><TrendingUp className="h-3 w-3 mr-1" />{vendor.growthRate}</>
                      ) : (
                        vendor.growthRate
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Monthly Reporting Trends
          </CardTitle>
          <CardDescription>Historical vendor reporting performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Reports Submitted</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>Total Patients</TableHead>
                <TableHead>On-Time Rate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyTrends.map((trend, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <p className="font-medium text-foreground">{trend.month}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{trend.reports} of {summaryStats.totalVendors}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">${trend.revenue.toLocaleString()}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{trend.patients.toLocaleString()}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={trend.onTime === 100 ? 'default' : trend.onTime >= 75 ? 'secondary' : 'destructive'}>
                      {trend.onTime}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generate Compliance Report</CardTitle>
            <CardDescription>Create vendor compliance and reporting summary</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Send Reminders</CardTitle>
            <CardDescription>Notify overdue vendors about missing reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Send Reminders
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export All Data</CardTitle>
            <CardDescription>Download comprehensive vendor data export</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}