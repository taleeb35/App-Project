import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Plus } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';

export default function DummyData() {
  const { toast } = useToast();
  const { selectedClinic } = useClinic();
  const [loading, setLoading] = useState(false);

  const generateDummyData = async () => {
    if (!selectedClinic) {
      toast({
        title: 'Error',
        description: 'Please select a clinic first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create dummy vendors
      const vendorsToInsert = [
        {
          name: 'Green Valley Dispensary',
          clinic_id: selectedClinic.id,
          contact_person: 'John Smith',
          email: 'john@greenvalley.com',
          phone: '555-0101',
          is_dummy: true,
        },
        {
          name: 'Healing Herbs Co.',
          clinic_id: selectedClinic.id,
          contact_person: 'Jane Doe',
          email: 'jane@healingherbs.com',
          phone: '555-0102',
          is_dummy: true,
        },
        {
          name: 'Natural Wellness Center',
          clinic_id: selectedClinic.id,
          contact_person: 'Bob Johnson',
          email: 'bob@naturalwellness.com',
          phone: '555-0103',
          is_dummy: true,
        },
      ];

      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .insert(vendorsToInsert as any)
        .select();

      if (vendorError) throw vendorError;

      // Create dummy patients
      const { data: patients, error: patientError } = await supabase
        .from('patients')
        .insert([
          {
            clinic_id: selectedClinic.id,
            k_number: 'K12345678',
            first_name: 'Michael',
            last_name: 'Anderson',
            email: 'michael.a@example.com',
            phone: '555-1001',
            date_of_birth: '1975-05-15',
            prescription_status: 'active',
            is_veteran: true,
            is_dummy: true,
          },
          {
            clinic_id: selectedClinic.id,
            k_number: 'K87654321',
            first_name: 'Sarah',
            last_name: 'Williams',
            email: 'sarah.w@example.com',
            phone: '555-1002',
            date_of_birth: '1982-08-22',
            prescription_status: 'active',
            is_veteran: true,
            is_dummy: true,
          },
          {
            clinic_id: selectedClinic.id,
            k_number: 'K11223344',
            first_name: 'David',
            last_name: 'Martinez',
            email: 'david.m@example.com',
            phone: '555-1003',
            date_of_birth: '1968-03-10',
            prescription_status: 'active',
            is_veteran: true,
            is_dummy: true,
          },
        ] as any)
        .select();

      if (patientError) throw patientError;

      // Create vendor reports
      const vendorReports: any[] = [];
      for (const patient of patients || []) {
        for (const vendor of vendors || []) {
          vendorReports.push({
            vendor_id: vendor.id,
            clinic_id: selectedClinic.id,
            patient_id: patient.id,
            report_month: new Date().toISOString().slice(0, 7) + '-01',
            product_name: 'Medical Cannabis',
            grams_sold: Math.floor(Math.random() * 50 + 10),
            amount: Math.floor(Math.random() * 500 + 100),
            is_dummy: true,
          });
        }
      }

      const { error: reportError } = await supabase
        .from('vendor_reports')
        .insert(vendorReports);

      if (reportError) throw reportError;

      toast({
        title: 'Success',
        description: `Generated dummy data: ${vendors?.length} vendors, ${patients?.length} patients, and ${vendorReports.length} vendor reports`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate dummy data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDummyData = async () => {
    if (!confirm('Are you sure you want to delete all dummy data? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Delete in reverse order due to foreign key constraints
      await supabase.from('vendor_reports' as any).delete().eq('is_dummy', true);
      await supabase.from('patients' as any).delete().eq('is_dummy', true);
      await supabase.from('vendors' as any).delete().eq('is_dummy', true);

      toast({
        title: 'Success',
        description: 'All dummy data has been deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete dummy data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dummy Data Management</h1>
          <p className="text-muted-foreground">Generate or delete test data for demonstration purposes</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Generate Dummy Data</CardTitle>
              <CardDescription>
                Create sample vendors, patients, and vendor reports for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={generateDummyData} disabled={loading || !selectedClinic} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {loading ? 'Generating...' : 'Generate Dummy Data'}
              </Button>
              {!selectedClinic && (
                <p className="text-sm text-muted-foreground mt-2">Please select a clinic first</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delete Dummy Data</CardTitle>
              <CardDescription>
                Remove all dummy data from the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={deleteDummyData}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {loading ? 'Deleting...' : 'Delete All Dummy Data'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
