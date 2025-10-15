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
    const updateUserProfile = async (session: Session | null) => {
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('app_role, clinic_id, first_name, last_name')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          setUser(session.user); // Fallback to basic user object
        } else {
          setUser({ ...session.user, ...profile });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    
    const { data: { session: initialSession } } = supabase.auth.getSession().then(({data}) => {
        setSession(data.session);
        updateUserProfile(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        updateUserProfile(session);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        title: 'Sign In Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed In',
        description: 'Welcome back!',
      });
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    toast({
      title: 'Signed Out',
      description: 'You have been successfully signed out.',
    });
  };
  
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
    return { error };
  };

  const isAdmin = user?.app_role === 'admin';

  const value = {
    user,
    session,
    loading,
    isAdmin,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};