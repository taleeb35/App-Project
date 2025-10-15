import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

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
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinicState] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for authentication to resolve

    const fetchClinics = async () => {
      setLoading(true);
      if (isAdmin) {
        // Super Admin: fetch all clinics
        const { data, error } = await supabase.from('clinics').select('*').order('name');
        if (data) {
          setClinics(data);
          // Try to load last selected clinic from storage, otherwise default to null (All Clinics)
          const storedClinicId = localStorage.getItem('selectedClinicId');
          const foundClinic = data.find(c => c.id === storedClinicId);
          setSelectedClinicState(foundClinic || null);
        }
      } else if (user?.clinic_id) {
        // Sub Admin: fetch only their assigned clinic
        const { data, error } = await supabase.from('clinics').select('*').eq('id', user.clinic_id).single();
        if (data) {
          setClinics([data]);
          setSelectedClinicState(data); // Automatically select and lock to their clinic
        }
      } else {
        // No user or no clinic_id, clear everything
        setClinics([]);
        setSelectedClinicState(null);
      }
      setLoading(false);
    };

    fetchClinics();
  }, [user, isAdmin, authLoading]);

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