import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Store, FileText, Users, DollarSign, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Vendors() {
  const [vendors, setVendors] = useState([
    {
      id: 1,
      name: "Green Valley Producers",
      type: "Cannabis Producer",
      contactPerson: "Mike Johnson",
      phone: "(555) 123-4567",
      email: "mike@greenvalley.com",
      patients: 324,
      monthlyRevenue: 125420.50,
      status: "Active",
      lastReport: "2024-11-15",
    },
    {
      id: 2,
      name: "Westside Cannabis Clinic",
      type: "Producer/Dispensary",
      contactPerson: "Sarah Wilson",
      phone: "(555) 234-5678", 
      email: "sarah@westside.com",
      patients: 198,
      monthlyRevenue: 78650.25,
      status: "Active",
      lastReport: "2024-11-14",
    },
    {
      id: 3,
      name: "Central Pharmacy",
      type: "Pharmacy",
      contactPerson: "Dr. James Brown",
      phone: "(555) 345-6789",
      email: "jbrown@centralpharm.com",
      patients: 89,
      monthlyRevenue: 15230.75,
      status: "Active",
      lastReport: "2024-11-15",
    },
    {
      id: 4,
      name: "Mountain View Cannabis",
      type: "Cannabis Producer",
      contactPerson: "Lisa Davis",
      phone: "(555) 456-7890",
      email: "lisa@mountainview.com",
      patients: 156,
      monthlyRevenue: 65420.00,
      status: "Pending",
      lastReport: "2024-11-10",
    },
  ]);

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.status === 'Active').length;
  const totalPatients = vendors.reduce((sum, v) => sum + v.patients, 0);
  const totalRevenue = vendors.reduce((sum, v) => sum + v.monthlyRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendor Management</h1>
          <p className="text-muted-foreground">Manage producers, dispensaries, and pharmacies</p>
        </div>
        
        <Dialog>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendorName">Vendor Name</Label>
                  <Input id="vendorName" placeholder="Enter vendor name" />
                </div>
                <div>
                  <Label htmlFor="vendorType">Type</Label>
                  <Input id="vendorType" placeholder="Producer/Pharmacy" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" placeholder="Contact name" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="(555) 123-4567" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="contact@vendor.com" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Cancel</Button>
                <Button>Add Vendor</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle>
            <Store className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalVendors}</div>
            <p className="text-xs text-muted-foreground">{activeVendors} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalPatients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all vendors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reports Pending</CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">2</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
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
          <CardDescription>Comprehensive list of all registered vendors and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Monthly Revenue</TableHead>
                <TableHead>Last Report</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">{vendor.contactPerson}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{vendor.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{vendor.phone}</p>
                      <p className="text-muted-foreground">{vendor.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <p className="font-medium">{vendor.patients}</p>
                      <p className="text-xs text-muted-foreground">patients</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">${vendor.monthlyRevenue.toLocaleString()}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{vendor.lastReport}</p>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={vendor.status === 'Active' ? 'default' : 'secondary'}
                      className={vendor.status === 'Active' ? 'bg-success text-success-foreground' : ''}
                    >
                      {vendor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}