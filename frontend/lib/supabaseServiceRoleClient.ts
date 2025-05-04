import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import { Database } from '@/types/supabase'; // TODO: Generate and import Supabase types
// IMPORTANT: Generating proper database types would eliminate the need for 'any' type casting
// Run 'npx supabase gen types typescript --project-id <your-project-id> --schema public > types/supabase.ts'
// See: https://supabase.com/docs/reference/javascript/typescript-support

// Ensure environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceRoleKey) {
  // Log a warning if the service role key is missing, as it's crucial for admin tasks.
  // In a production environment, this should likely throw an error or have robust handling.
  console.warn(
    'Missing environment variable: SUPABASE_SERVICE_ROLE_KEY. Server-side Supabase operations requiring admin privileges will fail.'
  );
  // Depending on requirements, you might want to throw an error here in production:
  // throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

// Create a single instance of the Supabase client for server-side operations
// Note: This client uses the SERVICE_ROLE_KEY and bypasses RLS.
// Use it ONLY in secure server-side environments (like NextAuth callbacks, API routes).
// DO NOT expose this client or the service role key to the browser.
// Using `any` to bypass TypeScript strictness when types cannot be generated
let supabaseServiceRoleClient: SupabaseClient<any> | null = null;

if (supabaseUrl && supabaseServiceRoleKey) {
  // Using `any` to bypass TypeScript strictness when types cannot be generated
  supabaseServiceRoleClient = createClient<any>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // Important: Disable auto-refreshing tokens for the service role client
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Supabase client instance configured with the Service Role Key.
 * WARNING: This client bypasses Row Level Security (RLS).
 * Use ONLY in trusted server-side environments for administrative tasks.
 * Returns null if SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export const supabaseAdmin = supabaseServiceRoleClient;

// Optional: You might also want a standard client for client-side or RLS-respecting server-side operations
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// if (!supabaseAnonKey) {
//   throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
// }
// export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);