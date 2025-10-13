import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, Calendar, Phone, Mail, MapPin, ShoppingBag, Package } from "lucide-react";
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
  patient_type: string | null;
  preferred_vendor_id: string | null;
  vendor_id: string | null;
};

type Vendor = {
  id: string;
  name: string;
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
  const [searchName, setSearchName] = useState("");
  const [searchKNumber, setSearchKNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const handleSearch = async () => {
    if (!searchName.trim() && !searchKNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name or K number to search",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      // Build robust search that supports full names with spaces
      const name = searchName.trim();
      const k = searchKNumber.trim();

      let patientData: any = null;
      let patientError: any = null;

      const base = () => supabase.from('patients').select('*').limit(1);
      const withK = (q: any) => (k ? q.ilike('k_number', `%${k}%`) : q);

      // 1) If K number provided, prioritize it
      if (k) {
        const { data, error } = await withK(base()).maybeSingle();
        patientData = data;
        patientError = error;
      }

      // 2) If not found by K or no K provided, search by name
      if (!patientData && name) {
        const tokens = name.split(/\s+/).filter(Boolean);
        if (tokens.length >= 2) {
          const first = tokens[0];
          const last = tokens[tokens.length - 1];

          // Try First + Last
          const res1 = await withK(base().ilike('first_name', `%${first}%`).ilike('last_name', `%${last}%`)).maybeSingle();
          patientData = res1.data;

          // Try Last + First
          if (!patientData) {
            const res2 = await withK(base().ilike('first_name', `%${last}%`).ilike('last_name', `%${first}%`)).maybeSingle();
            patientData = res2.data;
          }

          // Fallback: OR on full string using PostgREST wildcard syntax
          if (!patientData) {
            const res3 = await withK(base().or(`first_name.ilike.*${name}*,last_name.ilike.*${name}*`)).maybeSingle();
            patientData = res3.data;
          }
        } else {
          // Single token: OR across first and last (use * wildcards for PostgREST .or)
          const res = await withK(base().or(`first_name.ilike.*${name}*,last_name.ilike.*${name}*`)).maybeSingle();
          patientData = res.data;
        }
      }


      if (patientError) throw patientError;

      if (!patientData) {
        toast({
          title: "Not Found",
          description: "No patient found with the provided information",
          variant: "destructive",
        });
        setPatient(null);
        setPurchases([]);
        return;
      }

      setPatient(patientData as any);

      // Fetch vendors linked to this patient through junction table
      const { data: patientVendorsData } = await supabase
        .from('patient_vendors' as any)
        .select(`
          vendor_id,
          vendors:vendor_id (
            id,
            name
          )
        `)
        .eq('patient_id', patientData.id);

      if (patientVendorsData && patientVendorsData.length > 0) {
        const vendorsList = patientVendorsData
          .map((pv: any) => pv.vendors)
          .filter(Boolean);
        setVendors(vendorsList);
      } else {
        // Fallback 1: legacy columns on patients table
        const legacyIds = [
          (patientData as any).vendor_id,
          (patientData as any).preferred_vendor_id,
        ].filter(Boolean);
        if (legacyIds.length > 0) {
          const { data: legacyVendors } = await supabase
            .from('vendors')
            .select('id, name')
            .in('id', legacyIds as string[]);
          setVendors(legacyVendors || []);
        } else {
          // Fallback 2: derive from vendor_reports
          const { data: reportVendors } = await supabase
            .from('vendor_reports' as any)
            .select('vendor_id')
            .eq('patient_id', patientData.id)
            .not('vendor_id', 'is', null);

          const uniqueIds = Array.from(new Set((reportVendors || []).map((r: any) => r.vendor_id)));
          if (uniqueIds.length > 0) {
            const { data: vendorsByReports } = await supabase
              .from('vendors')
              .select('id, name')
              .in('id', uniqueIds);
            setVendors(vendorsByReports || []);
          } else {
            setVendors([]);
          }
        }
      }

      // Fetch patient purchases from vendor reports
      const { data: purchasesData, error: purchasesError} = await supabase
        .from('vendor_reports' as any)
        .select('*')
        .eq('patient_id', patientData.id)
        .order('report_month', { ascending: false });

      if (purchasesError) throw purchasesError;
      setPurchases((purchasesData || []).map((r: any) => ({
        id: r.id,
        purchase_date: r.report_month,
        amount: r.amount || 0,
        grams: r.grams_sold,
        product_type: r.product_name
      })));

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
      setVendors([]);
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
        <p className="text-muted-foreground">Search for patients by name or K number</p>
      </div>

      {/* Search Box */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Patient
          </CardTitle>
          <CardDescription>Enter a name or K number to search for patient records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="search_name" className="text-sm font-medium mb-2 block">
                Search by Name
              </label>
              <Input
                id="search_name"
                placeholder="Enter patient name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <label htmlFor="search_k_number" className="text-sm font-medium mb-2 block">
                Search by K Number
              </label>
              <Input
                id="search_k_number"
                placeholder="Enter K number..."
                value={searchKNumber}
                onChange={(e) => setSearchKNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <Button onClick={handleSearch} disabled={searching} className="w-full">
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
                      <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Vendors</p>
                        {vendors.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {vendors.map((vendor) => (
                              <Badge key={vendor.id} variant="outline">
                                {vendor.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="font-medium">Not assigned</p>
                        )}
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
                        <p className="text-sm text-muted-foreground">Patient Type</p>
                        <Badge variant={patient.patient_type === 'Veteran' ? 'default' : 'outline'}>
                          {patient.patient_type}
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
