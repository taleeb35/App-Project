import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Clinic = {
  id: string;
  name: string;
  license_number: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
};

export default function Clinics() {
  const { toast } = useToast();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    license_number: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClinics(data || []);
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

  const handleAddClinic = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Clinic name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from('clinics').insert(formData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Clinic added successfully",
      });

      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        license_number: "",
        phone: "",
        email: "",
        address: "",
      });
      fetchClinics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditClinic = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setFormData({
      name: clinic.name,
      license_number: clinic.license_number || "",
      phone: clinic.phone || "",
      email: clinic.email || "",
      address: clinic.address || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateClinic = async () => {
    if (!editingClinic) return;
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Clinic name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('clinics')
        .update(formData)
        .eq('id', editingClinic.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Clinic updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingClinic(null);
      setFormData({
        name: "",
        license_number: "",
        phone: "",
        email: "",
        address: "",
      });
      fetchClinics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClinic = async (id: string) => {
    if (!confirm("Are you sure you want to delete this clinic? This will affect associated vendors and patients.")) return;

    try {
      const { error } = await supabase
        .from('clinics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Clinic deleted successfully",
      });
      fetchClinics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clinic Management</h1>
          <p className="text-muted-foreground">Manage multiple clinic locations</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Clinic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Clinic</DialogTitle>
              <DialogDescription>Add a new clinic location to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Clinic Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter clinic name"
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
                  placeholder="contact@clinic.com"
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
              <Button onClick={handleAddClinic}>Add Clinic</Button>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinic Name</TableHead>
                  <TableHead>License #</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No clinics found. Add your first clinic to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  clinics.map((clinic) => (
                    <TableRow key={clinic.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{clinic.name}</p>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{clinic.license_number || 'N/A'}</code>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{clinic.phone || 'N/A'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{clinic.email || 'N/A'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{clinic.address || 'N/A'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditClinic(clinic)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClinic(clinic.id)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Clinic</DialogTitle>
            <DialogDescription>Update clinic information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit_name">Clinic Name *</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter clinic name"
              />
            </div>
            <div>
              <Label htmlFor="edit_license_number">License Number</Label>
              <Input
                id="edit_license_number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="License #"
              />
            </div>
            <div>
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@clinic.com"
              />
            </div>
            <div>
              <Label htmlFor="edit_address">Address</Label>
              <Input
                id="edit_address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateClinic}>Update Clinic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
