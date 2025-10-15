import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { useToast } from '@/hooks/use-toast';
import { Users, DollarSign, Activity } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const { selectedClinic, loading: clinicLoading } = useClinic();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalVeterans: 0,
    totalCivilians: 0,
    totalSpent: 0,
    percentVeteransOrdered: 0,
    percentCiviliansOrdered: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [patientTypeData, setPatientTypeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Don't fetch until the clinic is loaded
      if (clinicLoading) return;

      setLoading(true);
      try {
        let patientQuery = supabase.from('patients').select('id, patient_type, status', { count: 'exact' });
        let reportQuery = supabase.from('vendor_reports').select('amount, patient_id, report_month, patients(patient_type)');

        // Scope queries to the selected clinic if one is chosen
        if (selectedClinic) {
          patientQuery = patientQuery.eq('clinic_id', selectedClinic.id);
          reportQuery = reportQuery.eq('clinic_id', selectedClinic.id);
        }

        const [{ data: patients, error: patientError, count: totalPatientsCount }, { data: reports, error: reportError }] = await Promise.all([
          patientQuery,
          reportQuery
        ]);

        if (patientError) throw patientError;
        if (reportError) throw reportError;

        const activePatients = patients?.filter(p => p.status === 'active') || [];
        const totalVeterans = activePatients.filter(p => p.patient_type === 'Veteran').length;
        const totalCivilians = activePatients.filter(p => p.patient_type === 'Civilian').length;
        const totalSpent = reports?.reduce((sum, report) => sum + (report.amount || 0), 0) || 0;
        
        const veteransWhoOrdered = new Set(reports?.filter(r => r.patients?.patient_type === 'Veteran').map(r => r.patient_id));
        const civiliansWhoOrdered = new Set(reports?.filter(r => r.patients?.patient_type === 'Civilian').map(r => r.patient_id));
        
        // FIX: Prevent division by zero errors that cause "NaN"
        const percentVeteransOrdered = totalVeterans > 0 ? (veteransWhoOrdered.size / totalVeterans) * 100 : 0;
        const percentCiviliansOrdered = totalCivilians > 0 ? (civiliansWhoOrdered.size / totalCivilians) * 100 : 0;

        setStats({
          totalPatients: totalPatientsCount || 0,
          totalVeterans,
          totalCivilians,
          totalSpent,
          percentVeteransOrdered,
          percentCiviliansOrdered,
        });

        const monthlyData = reports?.reduce((acc, report) => {
          const month = new Date(report.report_month).toLocaleString('default', { month: 'short', year: 'numeric' });
          acc[month] = (acc[month] || 0) + (report.amount || 0);
          return acc;
        }, {});
        
        const formattedChartData = Object.keys(monthlyData || {}).map(month => ({ name: month, total: monthlyData[month] })).slice(-12);
        
        setChartData(formattedChartData);
        setPatientTypeData([
          { name: 'Veterans', value: totalVeterans },
          { name: 'Civilians', value: totalCivilians },
        ]);

      } catch (error: any) {
        console.error("Dashboard Error:", error);
        toast({
          title: 'Failed to Load Dashboard',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedClinic, clinicLoading, toast]);

  if (loading || clinicLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {selectedClinic ? `Showing data for ${selectedClinic.name}` : "Showing data for All Clinics"}
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From all recorded reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Patients</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVeterans + stats.totalCivilians}</div>
            <p className="text-xs text-muted-foreground">{stats.totalPatients} total registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Veterans Activity</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.percentVeteransOrdered.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Of {stats.totalVeterans} active veterans ordered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Civilians Activity</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.percentCiviliansOrdered.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Of {stats.totalCivilians} active civilians ordered</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardContent className="pl-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            ) : (<div className="h-[350px] flex items-center justify-center text-muted-foreground">No revenue data available.</div>)}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Patient Distribution</CardTitle><CardDescription>Active veterans vs civilians.</CardDescription></CardHeader>
          <CardContent>
             {stats.totalVeterans > 0 || stats.totalCivilians > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={patientTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                    {patientTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
             ) : (<div className="h-[350px] flex items-center justify-center text-muted-foreground">No patient data available.</div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}