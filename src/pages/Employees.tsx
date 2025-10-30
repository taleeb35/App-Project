import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [newEmployee, setNewEmployee] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    clinicId: '',
    status: 'active',
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
        .from('clinic_employees' as any)
        .select(`
          id,
          user_id,
          clinic_id,
          clinics!clinic_employees_clinic_id_fkey (name)
        `);

      if (employeesError) throw employeesError;

      // Get user profiles separately
      const userIds = employeesData?.map((emp: any) => emp.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles' as any)
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to employees
      const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);

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
    if (!newEmployee.email || !newEmployee.password || !newEmployee.fullName || !newEmployee.phone || !newEmployee.clinicId) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
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
        .from('profiles' as any)
        .update({ 
          clinic_id: newEmployee.clinicId,
          phone: newEmployee.phone,
          status: newEmployee.status,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Create clinic employee assignment
      const { error: assignError } = await supabase
        .from('clinic_employees' as any)
        .insert({
          user_id: authData.user.id,
          clinic_id: newEmployee.clinicId,
        } as any);

      if (assignError) throw assignError;

      toast({
        title: 'Success',
        description: 'Sub Admin account created successfully. Share the credentials with them.',
      });

      setIsAddDialogOpen(false);
      setNewEmployee({ email: '', password: '', fullName: '', phone: '', clinicId: '', status: 'active' });
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
        .from('clinic_employees' as any)
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sub Admin Management</h1>
            <p className="text-muted-foreground">Create and manage sub admin accounts for clinic access</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Sub Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Sub Admin</DialogTitle>
                <DialogDescription>
                  Create a sub admin account with login credentials to share
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={newEmployee.fullName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Set Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    placeholder="Create a secure password"
                    required
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
                <div>
                  <Label htmlFor="status">Account Status *</Label>
                  <Select
                    value={newEmployee.status}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active (Can Login)</SelectItem>
                      <SelectItem value="draft">Draft (Cannot Login)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddEmployee} disabled={loading} className="w-full">
                  {loading ? 'Creating Account...' : 'Create Sub Admin Account'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sub Admin Accounts</CardTitle>
            <CardDescription>All sub admin accounts with clinic assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                  {employees.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((employee) => (
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
              
              {employees.length > 0 && (() => {
                const totalPages = Math.ceil(employees.length / pageSize);
                const startIndex = (currentPage - 1) * pageSize;
                const endIndex = Math.min(startIndex + pageSize, employees.length);
                
                const getPageNumbers = () => {
                  const pages: (number | string)[] = [];
                  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
                  pages.push(1);
                  let start = Math.max(2, currentPage - 1);
                  let end = Math.min(totalPages - 1, currentPage + 1);
                  if (start > 2) pages.push('ellipsis-start');
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (end < totalPages - 1) pages.push('ellipsis-end');
                  if (totalPages > 1) pages.push(totalPages);
                  return pages;
                };
                
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{endIndex} of {employees.length}
                      </span>
                      <Select value={pageSize.toString()} onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                      }}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 / page</SelectItem>
                          <SelectItem value="50">50 / page</SelectItem>
                          <SelectItem value="75">75 / page</SelectItem>
                          <SelectItem value="100">100 / page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {getPageNumbers().map((page, index) => {
                            if (typeof page === 'string') {
                              return (
                                <PaginationItem key={`${page}-${index}`}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
