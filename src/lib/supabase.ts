import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Robust client that works on preview and custom domains
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const URL_ENV = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// Fallback URL from project id if URL env is missing
const URL = URL_ENV || (PROJECT_ID ? `https://${PROJECT_ID}.supabase.co` : undefined);

if (!URL || !KEY) {
  // Do not log secrets; only show presence flags
  // This throws early with a clear message instead of a cryptic SDK error
  // eslint-disable-next-line no-console
  console.error('[Supabase] Missing configuration', { hasUrl: !!URL, hasKey: !!KEY, projectId: PROJECT_ID });
  throw new Error('Supabase configuration missing. Please refresh the page or contact support.');
}

export const supabase = createClient<Database>(URL, KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
