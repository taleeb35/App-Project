import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Store, FileText, Users, DollarSign, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Vendor = {
  id: string;
  name: string;
  license_number: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string | null;
  clinic_id: string | null;
  created_at: string;
};

export default function Vendors() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    license_number: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors((data as any) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch vendors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async () => {
    try {
      const name = formData.name.trim();
      if (!name) {
        toast({ title: 'Name required', description: 'Please enter a vendor name', variant: 'destructive' });
        return;
      }

      // Prevent duplicates by checking for existing vendor with same name (case-insensitive)
      const { data: existing, error: checkError } = await supabase
        .from('vendors')
        .select('id')
        .ilike('name', name)
        .limit(1)
        .maybeSingle();
      if (checkError) console.warn('Vendor check error', checkError);

      if (existing?.id) {
        toast({ title: 'Duplicate prevented', description: 'A vendor with this name already exists.' });
        setIsAddDialogOpen(false);
        setFormData({ name: '', license_number: '', contact_person: '', phone: '', email: '', address: '' });
        return;
      }

      const { error } = await supabase.from('vendors').insert({
        ...formData,
        name,
        status: 'active',
      } as any);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Vendor added successfully',
      });

      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        license_number: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
      });
      fetchVendors();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      license_number: vendor.license_number || "",
      contact_person: vendor.contact_person || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      address: vendor.address || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateVendor = async () => {
    if (!editingVendor) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .update(formData)
        .eq('id', editingVendor.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingVendor(null);
      setFormData({
        name: "",
        license_number: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
      });
      fetchVendors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
      fetchVendors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const activeVendors = vendors.filter(v => v.status === 'active').length;

  const handleCleanupDuplicates = async () => {
    const { data, error } = await supabase.functions.invoke('cleanup-duplicate-vendors');
    if (error) {
      toast({ title: 'Cleanup failed', description: String(error), variant: 'destructive' });
      return;
    }
    toast({ title: 'Cleanup complete', description: (data as any)?.message || 'Removed duplicate vendors' });
    fetchVendors();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendor Management</h1>
          <p className="text-muted-foreground">Manage producers, dispensaries, and pharmacies</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCleanupDuplicates}>Clean Duplicates</Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Vendor
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>Add a new producer, dispensary, or pharmacy to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter vendor name"
                />
              </div>
              <div>
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="License #"
                />
              </div>
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Contact name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@vendor.com"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddVendor}>Add Vendor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Vendor</DialogTitle>
              <DialogDescription>Update vendor information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="edit-name">Vendor Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter vendor name"
                />
              </div>
              <div>
                <Label htmlFor="edit-license_number">License Number</Label>
                <Input
                  id="edit-license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="License #"
                />
              </div>
              <div>
                <Label htmlFor="edit-contact_person">Contact Person</Label>
                <Input
                  id="edit-contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Contact name"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@vendor.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateVendor}>Update Vendor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle>
            <Store className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{vendors.length}</div>
            <p className="text-xs text-muted-foreground">{activeVendors} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Status</CardTitle>
            <Badge className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeVendors}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{vendors.length - activeVendors}</div>
            <p className="text-xs text-muted-foreground">Not active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Licensed</CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{vendors.filter(v => v.license_number).length}</div>
            <p className="text-xs text-muted-foreground">With license #</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            All Vendors
          </CardTitle>
          <CardDescription>Comprehensive list of all registered vendors</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>License #</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No vendors found
                    </TableCell>
                  </TableRow>
                ) : (
                  vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{vendor.name}</p>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{vendor.license_number || 'N/A'}</code>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{vendor.contact_person || 'N/A'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{vendor.phone || 'N/A'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{vendor.email || 'N/A'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={vendor.status === 'active' ? 'default' : 'secondary'}
                          className={vendor.status === 'active' ? 'bg-success text-success-foreground' : ''}
                        >
                          {vendor.status || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditVendor(vendor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteVendor(vendor.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
