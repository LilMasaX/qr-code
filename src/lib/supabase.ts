import { createClient } from '@supabase/supabase-js';

// Public client (safe to use on the browser) - uses the anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Export the public client for use in components / client-side code
export const supabase = createClient(supabaseUrl, supabaseAnonKey);