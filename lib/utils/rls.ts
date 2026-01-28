import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client authenticated as a specific user for testing RLS.
 * 
 * @param token - The JWT access token of the user (e.g., from login or signUp)
 * @returns SupabaseClient configured with the user's token
 */
export const createWrappedClient = (token: string): SupabaseClient => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        }
    );
};

/**
 * Creates a Service Role client that bypasses RLS.
 * Use this for test setup/teardown only.
 */
export const createServiceRoleClient = (): SupabaseClient => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
};
