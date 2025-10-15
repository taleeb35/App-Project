import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users, DollarSign, Activity } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
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
      setLoading(true);
      try {
        let patientQuery = supabase.from('patients').select('id, patient_type, status', { count: 'exact' });
        let reportQuery = supabase.from('vendor_reports').select('amount, patient_id, report_month, patients(patient_type)');

        if (selectedClinic) {
          patientQuery = patientQuery.eq('clinic_id', selectedClinic.id);
          reportQuery = reportQuery.eq('clinic_id', selectedClinic.id);
        }

        const [{ data: patients, error: patientError, count: totalPatientsCount }, { data: reports, error: reportError }] = await Promise.all([ patientQuery, reportQuery ]);

        if (patientError) throw patientError;
        if (reportError) throw reportError;
        
        const activePatients = patients?.filter(p => p.status === 'active') || [];
        const totalVeterans = activePatients.filter(p => p.patient_type === 'Veteran').length;
        const totalCivilians = activePatients.filter(p => p.patient_type === 'Civilian').length;
        const totalSpent = reports?.reduce((sum, report) => sum + (report.amount || 0), 0) || 0;
        
        const veteransWhoOrdered = new Set(reports?.filter(r => r.patients?.patient_type === 'Veteran').map(r => r.patient_id));
        const civiliansWhoOrdered = new Set(reports?.filter(r => r.patients?.patient_type === 'Civilian').map(r => r.patient_id));
        
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
          if (!acc[month]) acc[month] = 0;
          acc[month] += (report.amount || 0);
          return acc;
        }, {});
        
        const formattedChartData = Object.keys(monthlyData || {}).map(month => ({ name: month, total: monthlyData[month] })).slice(-12);
        
        setChartData(formattedChartData);
        setPatientTypeData([
          { name: 'Veterans', value: totalVeterans },
          { name: 'Civilians', value: totalCivilians },
        ]);

      } catch (error: any) {
        console.error("Dashboard Page Error:", error);
        toast({
          title: 'Error Loading Dashboard',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    // This condition is the key fix: only run when both user and clinic contexts are done loading
    if (!authLoading && !clinicLoading) {
      fetchDashboardData();
    }
  }, [user, selectedClinic, authLoading, clinicLoading, toast]);

  // Show a loading spinner while waiting for user and clinic data
  if (authLoading || clinicLoading || loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div></div>;
  }
  
  // A clean state for when there is no data
  if (stats.totalPatients === 0 && chartData.length === 0) {
      return (
          <div className="text-center py-10">
              <h2 className="text-2xl font-semibold">Welcome!</h2>
              <p className="text-muted-foreground mt-2">There is no data to display for this clinic yet. Start by uploading a vendor report.</p>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          {selectedClinic ? `Showing data for ${selectedClinic.name}` : "Showing data for All Clinics"}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Active Patients</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalVeterans + stats.totalCivilians}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Veterans Activity</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.percentVeteransOrdered.toFixed(1)}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Civilians Activity</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.percentCiviliansOrdered.toFixed(1)}%</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis tickFormatter={(value) => `$${value}`} /><Tooltip formatter={(value) => `$${value.toFixed(2)}`} /><Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Patient Distribution</CardTitle><CardDescription>Active veterans vs civilians.</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={patientTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>{patientTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}