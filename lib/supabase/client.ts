import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Use createBrowserClient from @supabase/ssr so the session is stored in
// cookies (not just localStorage). This makes the session available to
// server-side API routes that validate auth via cookie-based session.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Export createClient function for use in services
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey);
