import { createClient } from '@supabase/supabase-js';

// Server-side client: MUST NOT be imported into client-side code
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for server-side client');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);