import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserX, Phone, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  clinic_id: string;
}

interface NonOrderingPatient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  patient_type: string;
  k_number: string;
  last_purchase_date: string | null;
  months_without_order: number;
}

export default function NonOrderingReport() {
  const [veteranPatients, setVeteranPatients] = useState<NonOrderingPatient[]>([]);
  const [civilianPatients, setCivilianPatients] = useState<NonOrderingPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setClinicId(data?.clinic_id || null);
    };

    fetchProfile();
  }, [user?.id]);

  useEffect(() => {
    if (clinicId) {
      fetchNonOrderingPatients();
    }
  }, [clinicId]);

  const fetchNonOrderingPatients = async () => {
    try {
      setLoading(true);
      
      // Get all patients from current clinic
      const { data: patients, error: patientsError } = await supabase
        .from("patients")
        .select("id, first_name, last_name, email, phone, patient_type, k_number")
        .eq("clinic_id", clinicId)
        .eq("status", "active");

      if (patientsError) throw patientsError;

      // Get all purchases for these patients
      const patientIds = patients?.map(p => p.id) || [];
      const { data: purchases, error: purchasesError } = await supabase
        .from("patient_purchases")
        .select("patient_id, purchase_date")
        .in("patient_id", patientIds)
        .order("purchase_date", { ascending: false });

      if (purchasesError) throw purchasesError;

      // Calculate months without orders for each patient
      const today = new Date();
      const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);

      const veteransWithoutOrders: NonOrderingPatient[] = [];
      const civiliansWithoutOrders: NonOrderingPatient[] = [];

      patients?.forEach(patient => {
        const patientPurchases = purchases?.filter(p => p.patient_id === patient.id) || [];
        
        // Get the most recent purchase date
        const lastPurchase = patientPurchases[0]?.purchase_date || null;
        const lastPurchaseDate = lastPurchase ? new Date(lastPurchase) : null;

        let monthsWithoutOrder = 0;
        if (!lastPurchaseDate) {
          monthsWithoutOrder = 12; // No purchases ever
        } else {
          const monthsDiff = (today.getFullYear() - lastPurchaseDate.getFullYear()) * 12 + 
                           (today.getMonth() - lastPurchaseDate.getMonth());
          monthsWithoutOrder = monthsDiff;
        }

        const nonOrderingPatient: NonOrderingPatient = {
          ...patient,
          last_purchase_date: lastPurchase,
          months_without_order: monthsWithoutOrder
        };

        // Veterans: no orders for 2+ consecutive months
        if (patient.patient_type === "Veteran" && monthsWithoutOrder >= 2) {
          veteransWithoutOrders.push(nonOrderingPatient);
        }
        
        // Civilians: no orders for 3+ consecutive months
        if (patient.patient_type === "Civilian" && monthsWithoutOrder >= 3) {
          civiliansWithoutOrders.push(nonOrderingPatient);
        }
      });

      setVeteranPatients(veteransWithoutOrders);
      setCivilianPatients(civiliansWithoutOrders);
    } catch (error: any) {
      console.error("Error fetching non-ordering patients:", error);
      toast.error("Failed to load non-ordering patients");
    } finally {
      setLoading(false);
    }
  };

  const PatientTable = ({ patients }: { patients: NonOrderingPatient[] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>K-Number</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Last Order</TableHead>
            <TableHead>Months Inactive</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No patients found in this category
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-mono text-sm">{patient.k_number}</TableCell>
                <TableCell className="font-medium">
                  {patient.first_name} {patient.last_name}
                </TableCell>
                <TableCell>
                  {patient.email ? (
                    <a 
                      href={`mailto:${patient.email}`} 
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {patient.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {patient.phone ? (
                    <a 
                      href={`tel:${patient.phone}`} 
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {patient.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {patient.last_purchase_date ? (
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(patient.last_purchase_date).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-warning text-warning">
                    {patient.months_without_order} months
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Non-Ordering Report</h1>
        <p className="text-muted-foreground">
          Track patients who haven't placed orders in consecutive months
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-warning" />
              Veterans
            </CardTitle>
            <CardDescription>No orders for 2+ consecutive months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "..." : veteranPatients.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Patients need follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-warning" />
              Civilians
            </CardTitle>
            <CardDescription>No orders for 3+ consecutive months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "..." : civilianPatients.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Patients need follow-up</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="veterans" className="w-full">
        <TabsList>
          <TabsTrigger value="veterans">
            Veterans ({veteranPatients.length})
          </TabsTrigger>
          <TabsTrigger value="civilians">
            Civilians ({civilianPatients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="veterans" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Veterans Without Orders (2+ Months)</CardTitle>
              <CardDescription>
                Contact these patients to check if they need assistance with ordering
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <PatientTable patients={veteranPatients} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="civilians" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Civilians Without Orders (3+ Months)</CardTitle>
              <CardDescription>
                Contact these patients to check if they need assistance with ordering
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <PatientTable patients={civilianPatients} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
