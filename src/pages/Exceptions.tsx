import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, User, CheckCircle, X, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function Exceptions() {
  const { toast } = useToast();
  const [exceptions, setExceptions] = useState([
    {
      id: 1,
      type: "Name Mismatch",
      priority: "High",
      patient: "John Smith",
      issue: "Vendor report shows 'Jon Smith' - possible match",
      vendor: "Green Valley",
      kNumber: "K123456789",
      suggestedMatch: "98% match confidence",
      status: "Pending",
      date: "2024-11-15",
    },
    {
      id: 2,
      type: "Missing from Clinic",
      priority: "Medium",
      patient: "Sarah Johnson",
      issue: "Patient found in vendor report but not in clinic database",
      vendor: "Westside Cannabis",
      kNumber: "K987654321",
      suggestedMatch: "No clinic record found",
      status: "Pending",
      date: "2024-11-15",
    },
    {
      id: 3,
      type: "Wrong Producer",
      priority: "Low",
      patient: "Mike Wilson",
      issue: "Patient assigned to Producer A but ordering from Producer B",
      vendor: "Central Pharmacy",
      kNumber: "K456789123",
      suggestedMatch: "Reassign to Central Pharmacy",
      status: "Pending",
      date: "2024-11-14",
    },
    {
      id: 4,
      type: "Name Mismatch",
      priority: "High",
      patient: "Lisa Davis",
      issue: "Multiple spelling variations found",
      vendor: "Mountain View",
      kNumber: "K789123456",
      suggestedMatch: "Manual review required",
      status: "Resolved",
      date: "2024-11-13",
    },
  ]);

  const pendingExceptions = exceptions.filter(e => e.status === 'Pending');
  const resolvedExceptions = exceptions.filter(e => e.status === 'Resolved');

  const handleResolve = (exceptionId: number, action: string) => {
    setExceptions(prev => 
      prev.map(exception => 
        exception.id === exceptionId 
          ? { ...exception, status: 'Resolved' }
          : exception
      )
    );
    
    toast({
      title: "Exception Resolved",
      description: `Exception #${exceptionId} has been ${action}`,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Name Mismatch': return User;
      case 'Missing from Clinic': return AlertTriangle;
      case 'Wrong Producer': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Exception Handling</h1>
        <p className="text-muted-foreground">Review and resolve data mismatches and issues</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Exceptions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingExceptions.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {pendingExceptions.filter(e => e.priority === 'High').length}
            </div>
            <p className="text-xs text-muted-foreground">Critical issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {resolvedExceptions.filter(e => e.date === '2024-11-15').length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Name Mismatches</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {pendingExceptions.filter(e => e.type === 'Name Mismatch').length}
            </div>
            <p className="text-xs text-muted-foreground">Need review</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Exceptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Pending Exceptions
          </CardTitle>
          <CardDescription>Issues that require manual review and resolution</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Issue Description</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Suggested Action</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingExceptions.map((exception) => {
                const TypeIcon = getTypeIcon(exception.type);
                return (
                  <TableRow key={exception.id}>
                    <TableCell>
                      <Badge variant={getPriorityColor(exception.priority) as any}>
                        {exception.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{exception.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{exception.patient}</p>
                        <p className="text-xs text-muted-foreground">{exception.kNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm max-w-xs">{exception.issue}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{exception.vendor}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">{exception.suggestedMatch}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{exception.date}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleResolve(exception.id, 'accepted')}
                        >
                          <CheckCircle className="h-4 w-4 text-success" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleResolve(exception.id, 'rejected')}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recently Resolved */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Recently Resolved
          </CardTitle>
          <CardDescription>Exceptions that have been successfully handled</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {resolvedExceptions.map((exception) => {
              const TypeIcon = getTypeIcon(exception.type);
              return (
                <div key={exception.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{exception.patient}</span>
                        <Badge variant="outline" className="text-xs">{exception.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{exception.issue}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="border-success text-success">Resolved</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{exception.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}