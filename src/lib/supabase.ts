import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Robust Supabase client with fallback URL using project ID if VITE_SUPABASE_URL is missing
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const fallbackUrl = projectId ? `https://${projectId}.supabase.co` : '';
const SUPABASE_URL = envUrl || fallbackUrl;
const SUPABASE_PUBLISHABLE_KEY = envKey;

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
