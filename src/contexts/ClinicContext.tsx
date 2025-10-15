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
          // SUPER ADMIN: Fetch all clinics and default to "All Clinics" view
          const { data, error } = await supabase.from('clinics').select('*').order('name');
          if (error) throw error;
          
          setClinics(data || []);
          // KEY FIX: We now check local storage ONLY if you want to restore a filter.
          // By default, it will be null for a fresh login.
          const storedClinicId = localStorage.getItem('selectedClinicId');
          if (storedClinicId) {
            const foundClinic = data?.find(c => c.id === storedClinicId);
            setSelectedClinicState(foundClinic || null);
          } else {
            setSelectedClinicState(null); // Default to All Clinics
          }
        
        } else if (user?.clinic_id) {
          // SUB ADMIN: Fetch only their assigned clinic
          const { data, error } = await supabase.from('clinics').select('*').eq('id', user.clinic_id).single();
          if (error) throw error;
          
          if (data) {
            setClinics([data]);
            setSelectedClinicState(data); // Auto-select their clinic
          }
        } else {
          setClinics([]);
          setSelectedClinicState(null);
        }
      } catch (error: any) {
        toast({ title: "Error Loading Clinic Data", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchClinicsForUser();
  }, [user, isAdmin, authLoading, toast]);

  const setSelectedClinic = (clinic: Clinic | null) => {
    if (isAdmin) { // Only Super Admins can change clinics
      setSelectedClinicState(clinic);
      if (clinic) {
        localStorage.setItem('selectedClinicId', clinic.id);
      } else {
        localStorage.removeItem('selectedClinicId');
      }
    }
  };

  const value = { clinics, selectedClinic, setSelectedClinic, loading };

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
};

export const useClinic = () => {
  return useContext(ClinicContext);
};