import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Robust Supabase client with fallback URL using project ID if VITE_SUPABASE_URL is missing
const DEFAULT_PROJECT_ID = 'jfgcwwlorwvdthadjtye';
const DEFAULT_URL = `https://${DEFAULT_PROJECT_ID}.supabase.co`;
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZ2N3d2xvcnd2ZHRoYWRqdHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNTM1MzYsImV4cCI6MjA3NDkyOTUzNn0.HMd6vFDzQTTS89D1naPg2J9_J33_VFQ4XN_-X6Jzz0I';

const projectId = (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined) || DEFAULT_PROJECT_ID;
const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const fallbackUrl = `https://${projectId}.supabase.co`;
const SUPABASE_URL = envUrl || fallbackUrl || DEFAULT_URL;
const SUPABASE_PUBLISHABLE_KEY = envKey || DEFAULT_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    'Supabase URL is missing. Ensure Cloud is enabled or set VITE_SUPABASE_PROJECT_ID.'
  );
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Supabase publishable key is missing. Please enable Cloud to provision credentials.'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
