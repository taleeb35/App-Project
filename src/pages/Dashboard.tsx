import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building2, 
  Pill, 
  AlertTriangle, 
  Upload,
  UserCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    activeVendors: 0,
    monthlyOrders: 0,
    exceptions: 0,
  });
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch patients count
      const { count: totalPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      const { count: activePatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch vendors count
      const { count: activeVendors } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch monthly purchases count
      const { count: monthlyOrders } = await supabase
        .from('patient_purchases')
        .select('*', { count: 'exact', head: true })
        .gte('purchase_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      setStats({
        totalPatients: totalPatients || 0,
        activePatients: activePatients || 0,
        activeVendors: activeVendors || 0,
        monthlyOrders: monthlyOrders || 0,
        exceptions: 0, // Will be calculated from data validation
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Total Patients",
      value: stats.totalPatients.toLocaleString(),
      subtitle: `${stats.activePatients} active`,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Active Vendors",
      value: stats.activeVendors.toString(),
      subtitle: "Registered",
      icon: Building2,
      color: "text-accent",
    },
    {
      title: "Monthly Orders",
      value: stats.monthlyOrders.toLocaleString(),
      subtitle: "This month",
      icon: Pill,
      color: "text-success",
    },
    {
      title: "Exceptions",
      value: stats.exceptions.toString(),
      subtitle: "Need review",
      icon: AlertTriangle,
      color: "text-warning",
    },
  ];


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your patient management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 w-20 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted rounded mb-2" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
          ))
        )}
      </div>


      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => navigate('/upload/clinic')} className="h-16 flex flex-col gap-2" variant="outline">
              <Upload className="h-5 w-5" />
              Upload Patient Data
            </Button>
            <Button onClick={() => navigate('/upload/vendor')} className="h-16 flex flex-col gap-2" variant="outline">
              <Building2 className="h-5 w-5" />
              Upload Vendor Reports
            </Button>
            <Button onClick={() => navigate('/patient/search')} className="h-16 flex flex-col gap-2" variant="outline">
              <UserCheck className="h-5 w-5" />
              Search Patients
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}