import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create a mock client if environment variables are not set
// autoRefreshToken is set to false to prevent refresh_token_not_found errors
// when there's no valid session. We'll manually refresh when needed.
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false, // Disable auto-refresh to prevent refresh_token_not_found errors
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Export createClient function for use in services
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false, // Disable auto-refresh to prevent refresh_token_not_found errors
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
};
