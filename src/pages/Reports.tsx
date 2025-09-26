import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  Building2, 
  TrendingUp,
  AlertTriangle,
  UserX
} from "lucide-react";

export default function Reports() {
  const reports = [
    {
      title: "Producer/Vendor Reconciliation",
      description: "Shows missing patients per vendor for each month",
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
      lastGenerated: "2024-11-15",
      vendors: 8,
      route: "/reports/reconciliation",
    },
    {
      title: "Non-Ordering Report", 
      description: "Veterans with no orders for 2+ months, Civilians for 3+ months",
      icon: UserX,
      color: "text-warning",
      bgColor: "bg-warning/10",
      lastGenerated: "2024-11-14",
      patients: 23,
      route: "/reports/non-ordering",
    },
    {
      title: "Business Trending Report",
      description: "Rolling 12-month analysis of ordering patterns and revenue",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      lastGenerated: "2024-11-15",
      months: 12,
      route: "/reports/trending",
    },
  ];

  const quickStats = [
    {
      title: "Total Reports Generated",
      value: "247",
      change: "+12 this month",
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Active Vendors",
      value: "8",
      change: "2 new this quarter",
      icon: Building2,
      color: "text-accent",
    },
    {
      title: "Exception Items",
      value: "15",
      change: "-8 resolved",
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      title: "Non-Ordering Patients",
      value: "23",
      change: "-5 from last month",
      icon: Users,
      color: "text-destructive",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground">Generate and view comprehensive system reports</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className={`w-12 h-12 ${report.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                <report.icon className={`h-6 w-6 ${report.color}`} />
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Generated:</span>
                  <span className="font-medium">{report.lastGenerated}</span>
                </div>
                
                {report.vendors && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vendors Tracked:</span>
                    <Badge variant="secondary">{report.vendors}</Badge>
                  </div>
                )}
                
                {report.patients && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Flagged Patients:</span>
                    <Badge variant="outline" className="border-warning text-warning">{report.patients}</Badge>
                  </div>
                )}
                
                {report.months && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Period Covered:</span>
                    <Badge variant="outline">{report.months} months</Badge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Recent Report Generation History
          </CardTitle>
          <CardDescription>Latest generated reports and downloads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                report: "Business Trending Report",
                generated: "2024-11-15 10:30 AM",
                type: "PDF",
                status: "Complete",
                size: "2.4 MB",
              },
              {
                report: "Vendor Reconciliation",
                generated: "2024-11-15 09:15 AM", 
                type: "PDF",
                status: "Complete",
                size: "1.8 MB",
              },
              {
                report: "Non-Ordering Report",
                generated: "2024-11-14 04:00 PM",
                type: "PDF", 
                status: "Complete",
                size: "856 KB",
              },
              {
                report: "Business Trending Report",
                generated: "2024-11-14 10:30 AM",
                type: "PDF",
                status: "Complete", 
                size: "2.3 MB",
              },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{item.report}</p>
                  <p className="text-sm text-muted-foreground">{item.generated}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant="outline">{item.type}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{item.size}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>Automated report generation schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                report: "Monthly Reconciliation",
                schedule: "1st of every month at 9:00 AM",
                nextRun: "2024-12-01 09:00 AM",
                status: "Active",
              },
              {
                report: "Weekly Non-Ordering Check",
                schedule: "Every Monday at 8:00 AM", 
                nextRun: "2024-11-18 08:00 AM",
                status: "Active",
              },
              {
                report: "Quarterly Business Trending",
                schedule: "1st of Jan, Apr, Jul, Oct at 10:00 AM",
                nextRun: "2025-01-01 10:00 AM",
                status: "Active",
              },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{item.report}</p>
                  <p className="text-sm text-muted-foreground">{item.schedule}</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant={item.status === 'Active' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Next: {item.nextRun}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}