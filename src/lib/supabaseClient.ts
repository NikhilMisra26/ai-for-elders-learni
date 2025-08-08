import { createClient } from '@supabase/supabase-js';

// Env variables must be prefixed with VITE_ to be exposed to the client in Vite.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // In production, throw an error to prevent unintended connections
  if (import.meta.env.MODE === 'production') {
    throw new Error(
      '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Configure your .env.* files.'
    );
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Configure your .env.* files.',
    );
  }
}

export const supabase = createClient(
  SUPABASE_URL as string,
  SUPABASE_ANON_KEY as string,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
