// @ts-nocheck
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type User = SupabaseUser & {
  app_role?: 'admin' | 'clinic_staff';
  clinic_id?: string;
  first_name?: string;
  last_name?: string;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // This function now reliably handles the entire loading sequence.
    const fetchUserSessionAndProfile = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('app_role, clinic_id, first_name, last_name')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error("AuthContext Error: Failed to fetch user profile.", profileError);
          setUser(session.user); // Fallback
        } else {
          setUser({ ...session.user, ...profile });
        }
      } else {
        setUser(null);
      }
      // Loading is only set to false AFTER everything is fetched.
      setLoading(false);
    };

    fetchUserSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // onAuthStateChange can trigger with existing session, so refetch profile
        setSession(newSession);
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
           fetchUserSessionAndProfile();
        } else if (event === 'SIGNED_OUT') {
           setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: 'Sign In Failed', description: error.message, variant: 'destructive' });
    }
    return { error };
  };

  const signOut = async () => {
    // Clear the remembered clinic on sign out
    localStorage.removeItem('selectedClinicId');
    await supabase.auth.signOut();
  };
  
  const resetPassword = async (email) => { /* ... existing code ... */ };

  const isAdmin = user?.app_role === 'admin';
  const value = { user, session, loading, isAdmin, signIn, signOut, resetPassword };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};