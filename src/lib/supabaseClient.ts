import { createClient } from '@supabase/supabase-js';

// MUST use import.meta.env.VITE_* directly — Vite replaces these at build time.
// Using `const meta = import.meta; meta.env.VITE_*` does NOT work with Vite's
// static string replacement and always results in undefined.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined);

const missingEnv = !supabaseUrl || !supabaseAnonKey;

if (missingEnv) {
  console.warn(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel project settings and redeploy.'
  );
}

const noopAuth = {
  getSession: async () => ({ data: { session: null } }),
  onAuthStateChange: (_event: any, _callback: any) => ({
    data: { subscription: { unsubscribe: () => {} } },
  }),
  signUp: async () => ({ data: null, error: new Error('Missing Supabase environment variables') }),
  signInWithPassword: async () => ({ data: null, error: new Error('Missing Supabase environment variables') }),
  signOut: async () => ({ data: null, error: null }),
};

export const supabase = missingEnv
  ? ({ auth: noopAuth } as any)
  : createClient(supabaseUrl!, supabaseAnonKey!);
