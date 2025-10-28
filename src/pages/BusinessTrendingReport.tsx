import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { TrendingUp, Users, DollarSign, Percent } from "lucide-react";

interface Profile {
  clinic_id: string | null;
}

interface MonthlyStats {
  totalActiveVeterans: number;
  veteransWhoOrdered: number;
  totalActiveCivilians: number;
  civiliansWhoOrdered: number;
  totalVeteranPurchases: number;
  totalCivilianPurchases: number;
  avgPerVeteran: number;
  avgPerCivilian: number;
}

export default function BusinessTrendingReport() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);

  // Generate list of last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    };
  });

  useEffect(() => {
    const fetchClinicId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("clinic_id")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setClinicId((profile as Profile).clinic_id);
        }
      }
    };
    fetchClinicId();
    
    // Set current month as default
    setSelectedMonth(format(new Date(), "yyyy-MM"));
  }, []);

  useEffect(() => {
    if (selectedMonth && clinicId) {
      fetchMonthlyStats();
    }
  }, [selectedMonth, clinicId]);

  const fetchMonthlyStats = async () => {
    if (!selectedMonth || !clinicId) return;

    setLoading(true);
    try {
      const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
      const monthEnd = endOfMonth(monthStart);
      const monthDate = format(monthStart, "yyyy-MM-dd");

      // Get all active patients for the clinic
      const { data: allPatients, error: patientsError } = await supabase
        .from("patients")
        .select("id, patient_type")
        .eq("clinic_id", clinicId)
        .eq("status", "active");

      if (patientsError) throw patientsError;

      const veterans = allPatients?.filter(p => p.patient_type === "Veteran") || [];
      const civilians = allPatients?.filter(p => p.patient_type === "Civilian") || [];

      // Get vendor reports for the selected month
      const { data: reports, error: reportsError } = await supabase
        .from("vendor_reports")
        .select("patient_id, amount")
        .eq("clinic_id", clinicId)
        .eq("report_month", monthDate);

      if (reportsError) throw reportsError;

      // Calculate statistics
      const veteranIds = new Set(veterans.map(v => v.id));
      const civilianIds = new Set(civilians.map(c => c.id));

      const veteranReports = reports?.filter(r => veteranIds.has(r.patient_id)) || [];
      const civilianReports = reports?.filter(r => civilianIds.has(r.patient_id)) || [];

      const veteransWhoOrdered = new Set(veteranReports.map(r => r.patient_id)).size;
      const civiliansWhoOrdered = new Set(civilianReports.map(r => r.patient_id)).size;

      const totalVeteranPurchases = veteranReports.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const totalCivilianPurchases = civilianReports.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

      setStats({
        totalActiveVeterans: veterans.length,
        veteransWhoOrdered,
        totalActiveCivilians: civilians.length,
        civiliansWhoOrdered,
        totalVeteranPurchases,
        totalCivilianPurchases,
        avgPerVeteran: veterans.length > 0 ? totalVeteranPurchases / veterans.length : 0,
        avgPerCivilian: civilians.length > 0 ? totalCivilianPurchases / civilians.length : 0,
      });
    } catch (error: any) {
      console.error("Error fetching monthly stats:", error);
      toast({
        title: "Error",
        description: "Failed to load monthly statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    format: formatType = "number" 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    format?: "number" | "currency" | "percent" 
  }) => {
    const formattedValue = formatType === "currency" 
      ? `$${value.toFixed(2)}`
      : formatType === "percent"
      ? `${value.toFixed(1)}%`
      : value.toLocaleString();

    return (
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formattedValue}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Trending Report</h1>
          <p className="text-muted-foreground mt-2">
            View monthly business performance metrics
          </p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Active Veterans"
              value={stats.totalActiveVeterans}
              icon={Users}
            />
            <StatCard
              title="% of Veterans Who Ordered"
              value={stats.totalActiveVeterans > 0 ? (stats.veteransWhoOrdered / stats.totalActiveVeterans) * 100 : 0}
              icon={Percent}
              format="percent"
            />
            <StatCard
              title="Total Active Civilians"
              value={stats.totalActiveCivilians}
              icon={Users}
            />
            <StatCard
              title="% of Civilians Who Ordered"
              value={stats.totalActiveCivilians > 0 ? (stats.civiliansWhoOrdered / stats.totalActiveCivilians) * 100 : 0}
              icon={Percent}
              format="percent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total $ Purchased by Veterans"
              value={stats.totalVeteranPurchases}
              icon={DollarSign}
              format="currency"
            />
            <StatCard
              title="Total $ Purchased by Civilians"
              value={stats.totalCivilianPurchases}
              icon={DollarSign}
              format="currency"
            />
            <StatCard
              title="Average $ per Veteran"
              value={stats.avgPerVeteran}
              icon={TrendingUp}
              format="currency"
            />
            <StatCard
              title="Average $ per Civilian"
              value={stats.avgPerCivilian}
              icon={TrendingUp}
              format="currency"
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Select a month to view statistics</p>
        </div>
      )}
    </div>
  );
}
