import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2 } from 'lucide-react';

type Clinic = {
  id: string;
  name: string;
};

type Employee = {
  id: string;
  user_id: string;
  clinic_id: string;
  email: string;
  full_name: string;
  clinic_name: string;
};

export default function Employees() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    email: '',
    password: '',
    fullName: '',
    clinicId: '',
  });

  useEffect(() => {
    fetchClinics();
    fetchEmployees();
  }, []);

  const fetchClinics = async () => {
    const { data, error } = await supabase
      .from('clinics')
      .select('id, name')
      .order('name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch clinics',
        variant: 'destructive',
      });
      return;
    }

    setClinics(data || []);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      // First get clinic employees with clinic info
      const { data: employeesData, error: employeesError } = await supabase
        .from('clinic_employees')
        .select(`
          id,
          user_id,
          clinic_id,
          clinics!clinic_employees_clinic_id_fkey (name)
        `);

      if (employeesError) throw employeesError;

      // Get user profiles separately
      const userIds = employeesData?.map(emp => emp.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to employees
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const formattedEmployees = employeesData?.map((emp: any) => {
        const profile = profilesMap.get(emp.user_id);
        return {
          id: emp.id,
          user_id: emp.user_id,
          clinic_id: emp.clinic_id,
          email: profile?.email || '',
          full_name: profile?.full_name || '',
          clinic_name: emp.clinics?.name || '',
        };
      }) || [];

      setEmployees(formattedEmployees);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch employees',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.email || !newEmployee.password || !newEmployee.fullName || !newEmployee.clinicId) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmployee.email,
        password: newEmployee.password,
        options: {
          data: {
            full_name: newEmployee.fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update profile with clinic_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ clinic_id: newEmployee.clinicId })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Create clinic employee assignment
      const { error: assignError } = await supabase
        .from('clinic_employees')
        .insert({
          user_id: authData.user.id,
          clinic_id: newEmployee.clinicId,
        });

      if (assignError) throw assignError;

      toast({
        title: 'Success',
        description: 'Employee added successfully',
      });

      setIsAddDialogOpen(false);
      setNewEmployee({ email: '', password: '', fullName: '', clinicId: '' });
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add employee',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to remove this employee?')) return;

    try {
      const { error } = await supabase
        .from('clinic_employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Employee removed successfully',
      });

      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove employee',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Clinic Employees</h1>
            <p className="text-muted-foreground">Manage employee access to clinics</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Create a new employee account and assign to a clinic
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={newEmployee.fullName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    placeholder="employee@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <Label htmlFor="clinic">Assign to Clinic</Label>
                  <Select
                    value={newEmployee.clinicId}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, clinicId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select clinic" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinics.map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddEmployee} disabled={loading} className="w-full">
                  {loading ? 'Adding...' : 'Add Employee'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee List</CardTitle>
            <CardDescription>View and manage all clinic employees</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Clinic</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.full_name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.clinic_name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
