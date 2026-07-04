import { createClient } from '@supabase/supabase-js';

const meta: any = import.meta;
const supabaseUrl = meta.env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

const missingEnv = !supabaseUrl || !supabaseAnonKey;

if (missingEnv) {
  console.warn(
    'Missing Supabase environment variables. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or set them in your environment.'
  );
}

const noopAuth = {
  getSession: async () => ({ data: { session: null } }),
  onAuthStateChange: (_event: any, callback: any) => ({
    data: { subscription: { unsubscribe: () => {} } },
  }),
  signUp: async () => ({ data: null, error: new Error('Missing Supabase environment variables') }),
  signInWithPassword: async () => ({ data: null, error: new Error('Missing Supabase environment variables') }),
  signOut: async () => ({ data: null, error: new Error('Missing Supabase environment variables') }),
};

export const supabase = missingEnv
  ? ({ auth: noopAuth } as any)
  : createClient(supabaseUrl, supabaseAnonKey);
