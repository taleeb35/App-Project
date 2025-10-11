import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Clinic = {
  id: string;
  name: string;
  license_number: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type ClinicContextType = {
  selectedClinic: Clinic | null;
  setSelectedClinic: (clinic: Clinic | null) => void;
  clinics: Clinic[];
  loading: boolean;
};

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setClinics(data || []);
      
      // Auto-select first clinic if none selected
      if (data && data.length > 0 && !selectedClinic) {
        setSelectedClinic(data[0]);
      }
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

  return (
    <ClinicContext.Provider value={{ selectedClinic, setSelectedClinic, clinics, loading }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
