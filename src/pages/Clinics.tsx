import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Clinic = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  sub_admin?: {
    user_id: string;
    full_name: string;
    email: string;
    phone: string;
    status: string;
  } | null;
};

export default function Clinics() {
  const { toast } = useToast();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSubAdminDialogOpen, setIsAddSubAdminDialogOpen] = useState(false);
  const [isEditSubAdminDialogOpen, setIsEditSubAdminDialogOpen] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState<{ user_id: string; clinic_id: string; full_name: string; email: string; phone: string; status: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [subAdminFormData, setSubAdminFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    clinicId: "",
    status: "active",
  });

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      // Fetch clinics
      const { data: clinicsData, error: clinicsError } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (clinicsError) throw clinicsError;

      // Fetch all employees (sub admins)
      const { data: employeesData, error: employeesError } = await supabase
        .from('clinic_employees')
        .select(`
          user_id,
          clinic_id,
          clinics!clinic_employees_clinic_id_fkey (id, name)
        `);

      if (employeesError) throw employeesError;

      // Get profiles for all employees
      const userIds = employeesData?.map((emp: any) => emp.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, status')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map sub admins to clinics
      const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);
      const clinicsWithSubAdmins = (clinicsData || []).map((clinic: any) => {
        const employee = employeesData?.find((emp: any) => emp.clinic_id === clinic.id);
        const profile = employee ? profilesMap.get(employee.user_id) : null;
        
        return {
          ...clinic,
          sub_admin: profile ? {
            user_id: employee.user_id,
            full_name: profile.full_name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            status: profile.status || 'active',
          } : null
        };
      });

      setClinics(clinicsWithSubAdmins);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch clinics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubAdmin = async () => {
    if (!subAdminFormData.fullName || !subAdminFormData.email || !subAdminFormData.phone || !subAdminFormData.password || !subAdminFormData.clinicId) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: subAdminFormData.email,
        password: subAdminFormData.password,
        options: {
          data: {
            full_name: subAdminFormData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update profile with phone and status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          clinic_id: subAdminFormData.clinicId,
          phone: subAdminFormData.phone,
          status: subAdminFormData.status,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Create clinic employee assignment
      const { error: assignError } = await supabase
        .from('clinic_employees')
        .insert({
          user_id: authData.user.id,
          clinic_id: subAdminFormData.clinicId,
        });

      if (assignError) throw assignError;

      toast({
        title: "Success",
        description: "Sub Admin account created successfully",
      });

      setIsAddSubAdminDialogOpen(false);
      setSubAdminFormData({ fullName: "", email: "", phone: "", password: "", clinicId: "", status: "active" });
      fetchClinics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add sub admin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubAdmin = (clinic: Clinic) => {
    if (!clinic.sub_admin) return;
    
    setEditingSubAdmin({
      user_id: clinic.sub_admin.user_id,
      clinic_id: clinic.id,
      full_name: clinic.sub_admin.full_name,
      email: clinic.sub_admin.email,
      phone: clinic.sub_admin.phone,
      status: clinic.sub_admin.status,
    });
    setSubAdminFormData({
      fullName: clinic.sub_admin.full_name,
      email: clinic.sub_admin.email,
      phone: clinic.sub_admin.phone,
      password: "",
      clinicId: clinic.id,
      status: clinic.sub_admin.status,
    });
    setIsEditSubAdminDialogOpen(true);
  };

  const handleUpdateSubAdmin = async () => {
    if (!editingSubAdmin) return;
    if (!subAdminFormData.fullName || !subAdminFormData.email || !subAdminFormData.phone) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: subAdminFormData.fullName,
          phone: subAdminFormData.phone,
          status: subAdminFormData.status,
        })
        .eq('id', editingSubAdmin.user_id);

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "Sub Admin updated successfully",
      });

      setIsEditSubAdminDialogOpen(false);
      setEditingSubAdmin(null);
      setSubAdminFormData({ fullName: "", email: "", phone: "", password: "", clinicId: "", status: "active" });
      fetchClinics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update sub admin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubAdmin = async (userId: string, clinicId: string) => {
    if (!confirm("Are you sure you want to remove this sub admin?")) return;

    setLoading(true);
    try {
      // Delete clinic employee assignment
      const { error: assignError } = await supabase
        .from('clinic_employees')
        .delete()
        .eq('user_id', userId)
        .eq('clinic_id', clinicId);

      if (assignError) throw assignError;

      toast({
        title: "Success",
        description: "Sub admin removed successfully",
      });

      fetchClinics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove sub admin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Status updated to ${newStatus}`,
      });

      fetchClinics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clinic Management</h1>
          <p className="text-muted-foreground">Manage clinic locations and their sub admins</p>
        </div>
        
        <Dialog open={isAddSubAdminDialogOpen} onOpenChange={setIsAddSubAdminDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Sub Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Sub Admin</DialogTitle>
              <DialogDescription>Create a sub admin account with login credentials to share</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={subAdminFormData.fullName}
                  onChange={(e) => setSubAdminFormData({ ...subAdminFormData, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={subAdminFormData.email}
                  onChange={(e) => setSubAdminFormData({ ...subAdminFormData, email: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={subAdminFormData.phone}
                  onChange={(e) => setSubAdminFormData({ ...subAdminFormData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="password">Set Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={subAdminFormData.password}
                  onChange={(e) => setSubAdminFormData({ ...subAdminFormData, password: e.target.value })}
                  placeholder="Create a secure password"
                />
              </div>
              <div>
                <Label htmlFor="clinic">Assign to Clinic *</Label>
                <Select
                  value={subAdminFormData.clinicId}
                  onValueChange={(value) => setSubAdminFormData({ ...subAdminFormData, clinicId: value })}
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
                  value={subAdminFormData.status}
                  onValueChange={(value) => setSubAdminFormData({ ...subAdminFormData, status: value })}
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddSubAdminDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddSubAdmin} disabled={loading}>
                {loading ? 'Creating...' : 'Create Sub Admin Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            All Clinics
          </CardTitle>
          <CardDescription>Total: {clinics.length} clinic(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic Name</TableHead>
                    <TableHead>Sub Admin Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No clinics found. Add your first sub admin to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clinics.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((clinic) => (
                      <TableRow key={clinic.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">{clinic.name}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{clinic.sub_admin?.full_name || 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{clinic.sub_admin?.email || 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{clinic.sub_admin?.phone || 'N/A'}</p>
                        </TableCell>
                        <TableCell>
                          {clinic.sub_admin ? (
                            <Select
                              value={clinic.sub_admin.status}
                              onValueChange={(value) => handleUpdateStatus(clinic.sub_admin!.user_id, value)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">
                                  <Badge variant="default" className="w-full">Active</Badge>
                                </SelectItem>
                                <SelectItem value="draft">
                                  <Badge variant="secondary" className="w-full">Draft</Badge>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {clinic.sub_admin && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditSubAdmin(clinic)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteSubAdmin(clinic.sub_admin!.user_id, clinic.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {clinics.length > 0 && (() => {
                const totalPages = Math.ceil(clinics.length / pageSize);
                const startIndex = (currentPage - 1) * pageSize;
                const endIndex = Math.min(startIndex + pageSize, clinics.length);
                
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
                        Showing {startIndex + 1}-{endIndex} of {clinics.length}
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
          )}
        </CardContent>
      </Card>

      {/* Edit Sub Admin Dialog */}
      <Dialog open={isEditSubAdminDialogOpen} onOpenChange={setIsEditSubAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub Admin</DialogTitle>
            <DialogDescription>Update sub admin information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit_fullName">Full Name *</Label>
              <Input
                id="edit_fullName"
                value={subAdminFormData.fullName}
                onChange={(e) => setSubAdminFormData({ ...subAdminFormData, fullName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="edit_email">Email *</Label>
              <Input
                id="edit_email"
                type="email"
                value={subAdminFormData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="edit_phone">Phone Number *</Label>
              <Input
                id="edit_phone"
                type="tel"
                value={subAdminFormData.phone}
                onChange={(e) => setSubAdminFormData({ ...subAdminFormData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="edit_clinic">Assigned Clinic</Label>
              <Input
                id="edit_clinic"
                value={clinics.find(c => c.id === subAdminFormData.clinicId)?.name || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Clinic assignment cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="edit_status">Account Status *</Label>
              <Select
                value={subAdminFormData.status}
                onValueChange={(value) => setSubAdminFormData({ ...subAdminFormData, status: value })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSubAdminDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateSubAdmin} disabled={loading}>
              {loading ? 'Updating...' : 'Update Sub Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
