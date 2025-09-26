import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, Phone, Mail, Calendar, DollarSign, Package } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PatientSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Mock patient data
  const patients = [
    {
      id: 1,
      name: "John Smith",
      kNumber: "K123456789",
      dob: "1985-03-15",
      phone: "(555) 123-4567",
      email: "john.smith@email.com",
      status: "Active",
      vendors: ["Green Valley", "Westside Cannabis"],
      monthlyData: [
        { month: "Nov 2024", vendor: "Green Valley", amount: 325.50, grams: 14.5 },
        { month: "Nov 2024", vendor: "Westside Cannabis", amount: 180.00, grams: 8.0 },
        { month: "Oct 2024", vendor: "Green Valley", amount: 295.75, grams: 13.2 },
        { month: "Sep 2024", vendor: "Green Valley", amount: 412.25, grams: 18.5 },
        { month: "Aug 2024", vendor: "Westside Cannabis", amount: 220.00, grams: 10.5 },
        { month: "Jul 2024", vendor: "Green Valley", amount: 385.50, grams: 17.0 },
      ]
    },
    {
      id: 2,
      name: "Jane Doe",
      kNumber: "K987654321",
      dob: "1978-11-22",
      phone: "(555) 987-6543",
      email: "jane.doe@email.com",
      status: "Active",
      vendors: ["Central Pharmacy"],
      monthlyData: [
        { month: "Nov 2024", vendor: "Central Pharmacy", amount: 85.00, grams: 0 },
        { month: "Oct 2024", vendor: "Central Pharmacy", amount: 90.00, grams: 0 },
        { month: "Sep 2024", vendor: "Central Pharmacy", amount: 85.00, grams: 0 },
      ]
    }
  ];

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.kNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateTotals = (patient: any) => {
    const totalAmount = patient.monthlyData.reduce((sum: number, record: any) => sum + record.amount, 0);
    const totalGrams = patient.monthlyData.reduce((sum: number, record: any) => sum + record.grams, 0);
    const avgAmount = totalAmount / patient.monthlyData.length;
    return { totalAmount, totalGrams, avgAmount };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Patient Search</h1>
        <p className="text-muted-foreground">Search and view detailed patient purchase history</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Patients
          </CardTitle>
          <CardDescription>Search by patient name or K number</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter patient name or K number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>Found {filteredPatients.length} patient(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">{patient.name}</h3>
                      <p className="text-sm text-muted-foreground">K#: {patient.kNumber}</p>
                      <div className="flex gap-2">
                        {patient.vendors.map((vendor, index) => (
                          <Badge key={index} variant="secondary">{vendor}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'}>
                        {patient.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {patient.monthlyData.length} month(s) of data
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Details */}
      {selectedPatient && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Patient Details: {selectedPatient.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span> {selectedPatient.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">K Number:</span> {selectedPatient.kNumber}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Date of Birth:</span> {selectedPatient.dob}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span> {selectedPatient.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span> {selectedPatient.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <Badge variant={selectedPatient.status === 'Active' ? 'default' : 'secondary'}>
                      {selectedPatient.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                6-Month Purchase Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(() => {
                  const { totalAmount, totalGrams, avgAmount } = calculateTotals(selectedPatient);
                  return (
                    <>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-success">{totalGrams.toFixed(1)}g</p>
                        <p className="text-sm text-muted-foreground">Total Grams</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-accent">${avgAmount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Average/Month</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Monthly Purchase History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Vendor/Pharmacy</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Grams</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPatient.monthlyData.map((record: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{record.month}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.vendor}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">${record.amount.toFixed(2)}</TableCell>
                      <TableCell>{record.grams > 0 ? `${record.grams}g` : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}