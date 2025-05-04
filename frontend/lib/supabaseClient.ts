import { createClient } from '@supabase/supabase-js';
// import { Database } from '@/types/supabase'; // TODO: Generate and import Supabase types
// IMPORTANT: Using 'any' type since we can't easily generate proper database types in Docker

// Ensure environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Supabase client for client-side usage (browser).
 * Uses public environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *
 * IMPORTANT: This client uses the anonymous key and should ONLY be used for operations
 * that are permissible for unauthenticated or authenticated users based on Row Level Security (RLS) policies.
 * Do NOT use this for administrative tasks requiring elevated privileges.
 */
/**
 * Supabase client for client-side usage (browser).
 * Uses public environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *
 * IMPORTANT: This client uses the anonymous key and should ONLY be used for operations
 * that are permissible for unauthenticated or authenticated users based on Row Level Security (RLS) policies.
 * Do NOT use this for administrative tasks requiring elevated privileges.
 *
 * Using `any` type since we can't easily generate proper database types in Docker
 */
export const supabase = createClient<any>(
  supabaseUrl,
  supabaseAnonKey
);