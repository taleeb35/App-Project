import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, Calendar, Phone, Mail, MapPin, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  k_number: string;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string | null;
  is_veteran: boolean | null;
};

type Purchase = {
  id: string;
  purchase_date: string;
  amount: number;
  grams: number | null;
  product_type: string | null;
};

export default function PatientSearch() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a K number to search",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      // Search for patient
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .ilike('k_number', `%${searchQuery}%`)
        .maybeSingle();

      if (patientError) throw patientError;

      if (!patientData) {
        toast({
          title: "Not Found",
          description: "No patient found with that K number",
          variant: "destructive",
        });
        setPatient(null);
        setPurchases([]);
        return;
      }

      setPatient(patientData);

      // Fetch patient purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('patient_purchases')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('purchase_date', { ascending: false });

      if (purchasesError) throw purchasesError;
      setPurchases(purchasesData || []);

      toast({
        title: "Success",
        description: "Patient found successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setPatient(null);
      setPurchases([]);
    } finally {
      setSearching(false);
    }
  };

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalGrams = purchases.reduce((sum, p) => sum + (Number(p.grams) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Patient Search</h1>
        <p className="text-muted-foreground">Search for patients by K number to view their information</p>
      </div>

      {/* Search Box */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Patient
          </CardTitle>
          <CardDescription>Enter a K number to search for patient records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter K number (e.g., K123456789)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient Details */}
      {patient && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Personal Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">K Number</p>
                        <code className="font-medium bg-muted px-2 py-1 rounded">{patient.k_number}</code>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">{patient.date_of_birth || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Veteran Status</p>
                        <Badge variant={patient.is_veteran ? 'default' : 'outline'}>
                          {patient.is_veteran ? 'Veteran' : 'Civilian'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{patient.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{patient.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{patient.address || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                          {patient.status || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Purchase History
                  </CardTitle>
                  <CardDescription>Total purchases: {purchases.length}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-foreground">${totalSpent.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{totalGrams.toFixed(2)}g total</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No purchase history found
                </div>
              ) : (
                <div className="space-y-3">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{purchase.product_type || 'Product'}</p>
                        <p className="text-sm text-muted-foreground">{new Date(purchase.purchase_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${Number(purchase.amount).toFixed(2)}</p>
                        {purchase.grams && <p className="text-sm text-muted-foreground">{purchase.grams}g</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
