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
import { useClinic } from "@/contexts/ClinicContext";

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { selectedClinic } = useClinic();
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
  }, [selectedClinic]);

  const fetchDashboardData = async () => {
    try {
      if (!selectedClinic?.id) {
        setLoading(false);
        return;
      }

      // Fetch all data in one go
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      
      const [patientsRes, vendorsRes, reportsRes] = await Promise.all([
        supabase.from('patients').select('id, status').eq('clinic_id', selectedClinic.id),
        supabase.from('vendors').select('id').eq('clinic_id', selectedClinic.id).eq('status', 'active'),
        supabase.from('vendor_reports').select('id').eq('clinic_id', selectedClinic.id).gte('report_month', currentMonth)
      ]);

      const totalPatients = patientsRes.data?.length || 0;
      const activePatients = patientsRes.data?.filter((p: any) => p.status === 'active').length || 0;

      setStats({
        totalPatients,
        activePatients,
        activeVendors: vendorsRes.data?.length || 0,
        monthlyOrders: reportsRes.data?.length || 0,
        exceptions: 0,
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
      {/* Page Header with Clinic Name */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            {selectedClinic?.name || "Loading..."}
          </h1>
        </div>
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
            <Button onClick={() => navigate('/vendors/reports')} className="h-16 flex flex-col gap-2" variant="outline">
              <Building2 className="h-5 w-5" />
              Upload Vendor Reports
            </Button>
            <Button onClick={() => navigate('/patients/search')} className="h-16 flex flex-col gap-2" variant="outline">
              <UserCheck className="h-5 w-5" />
              Search Patients
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
