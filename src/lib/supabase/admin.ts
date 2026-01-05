
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Supabase Admin Client
 * DANGEROUS: Uses service_role key to bypass RLS.
 * Use ONLY in server-side API routes that have their own admin authorization checks.
 */
export const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)
