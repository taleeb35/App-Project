import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

type Clinic = {
  id: string;
  name: string;
};

interface ClinicContextType {
  clinics: Clinic[];
  selectedClinic: Clinic | null;
  setSelectedClinic: (clinic: Clinic | null) => void;
  loading: boolean;
}

const ClinicContext = createContext<ClinicContextType>({
  clinics: [],
  selectedClinic: null,
  setSelectedClinic: () => {},
  loading: true,
});

export const ClinicProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinicState] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for authentication to finish before doing anything
    if (authLoading) {
      return;
    }

    const fetchClinicsForUser = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          // SUPER ADMIN: Fetch all clinics
          const { data, error } = await supabase.from('clinics').select('*').order('name');
          if (error) throw error;
          
          setClinics(data || []);
          const storedClinicId = localStorage.getItem('selectedClinicId');
          const foundClinic = data?.find(c => c.id === storedClinicId);
          setSelectedClinicState(foundClinic || null); // Default to "All Clinics"
        
        } else if (user?.clinic_id) {
          // SUB ADMIN: Fetch only their assigned clinic
          const { data, error } = await supabase.from('clinics').select('*').eq('id', user.clinic_id).single();
          if (error) throw error;
          
          if (data) {
            setClinics([data]);
            setSelectedClinicState(data); // Auto-select their clinic
          }
        } else {
          // No user or no assigned clinic, so clear data
          setClinics([]);
          setSelectedClinicState(null);
        }
      } catch (error: any) {
        console.error("ClinicContext Error: Failed to fetch clinics.", error);
        toast({
          title: "Error Loading Clinic Data",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClinicsForUser();
  }, [user, isAdmin, authLoading, toast]);

  const setSelectedClinic = (clinic: Clinic | null) => {
    setSelectedClinicState(clinic);
    if (clinic) {
      localStorage.setItem('selectedClinicId', clinic.id);
    } else {
      localStorage.removeItem('selectedClinicId');
    }
  };

  const value = {
    clinics,
    selectedClinic,
    setSelectedClinic,
    loading,
  };

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};

export const useClinic = () => {
  return useContext(ClinicContext);
};