import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Download, Filter, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PatientDatabase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [producerFilter, setProducerFilter] = useState("all");

  const patients = [
    {
      id: 1,
      name: "John Smith",
      kNumber: "K123456789",
      dob: "1985-03-15",
      phone: "(555) 123-4567",
      status: "Active",
      producer: "Green Valley",
      lastOrder: "2024-11-15",
      totalSpent: 2450.75,
      veteranStatus: "Veteran",
    },
    {
      id: 2,
      name: "Jane Doe", 
      kNumber: "K987654321",
      dob: "1978-11-22",
      phone: "(555) 987-6543",
      status: "Active",
      producer: "Central Pharmacy",
      lastOrder: "2024-11-14",
      totalSpent: 890.50,
      veteranStatus: "Civilian",
    },
    {
      id: 3,
      name: "Mike Wilson",
      kNumber: "K456789123",
      dob: "1990-07-08",
      phone: "(555) 456-7890",
      status: "Inactive",
      producer: "Westside Cannabis",
      lastOrder: "2024-09-15",
      totalSpent: 1230.25,
      veteranStatus: "Veteran",
    },
    {
      id: 4,
      name: "Sarah Johnson",
      kNumber: "K789123456",
      dob: "1982-12-03",
      phone: "(555) 234-5678",
      status: "Active",
      producer: "Mountain View",
      lastOrder: "2024-11-13",
      totalSpent: 1567.89,
      veteranStatus: "Civilian",
    },
  ];

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.kNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || patient.status.toLowerCase() === statusFilter;
    const matchesProducer = producerFilter === "all" || patient.producer === producerFilter;
    
    return matchesSearch && matchesStatus && matchesProducer;
  });

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'Active').length,
    veterans: patients.filter(p => p.veteranStatus === 'Veteran').length,
    totalRevenue: patients.reduce((sum, p) => sum + p.totalSpent, 0),
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patient Database</h1>
          <p className="text-muted-foreground">Complete patient registry and information management</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.active} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Veterans</CardTitle>
            <Badge className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.veterans}</div>
            <p className="text-xs text-muted-foreground">{((stats.veterans / stats.total) * 100).toFixed(1)}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <span className="h-4 w-4 text-success">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg per Patient</CardTitle>
            <span className="h-4 w-4 text-warning">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${(stats.totalRevenue / stats.total).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Lifetime value</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search & Filter Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by name or K number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={producerFilter} onValueChange={setProducerFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Producer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Producers</SelectItem>
                <SelectItem value="Green Valley">Green Valley</SelectItem>
                <SelectItem value="Central Pharmacy">Central Pharmacy</SelectItem>
                <SelectItem value="Westside Cannabis">Westside Cannabis</SelectItem>
                <SelectItem value="Mountain View">Mountain View</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Registry</CardTitle>
          <CardDescription>Showing {filteredPatients.length} of {patients.length} patients</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Info</TableHead>
                <TableHead>K Number</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Producer</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Veteran Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">DOB: {patient.dob}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{patient.kNumber}</code>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{patient.phone}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'}>
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{patient.producer}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{patient.lastOrder}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">${patient.totalSpent.toLocaleString()}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={patient.veteranStatus === 'Veteran' ? 'default' : 'outline'}>
                      {patient.veteranStatus}
                    </Badge>
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