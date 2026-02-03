
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Supabase Admin Client
 * DANGEROUS: Uses service_role key to bypass RLS.
 * Use ONLY in server-side API routes that have their own admin authorization checks.
 */
export const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Supabase URL and Service Role Key are required.')
    }

    return createClient<Database>(url, key)
}

// For compatibility
export const supabaseAdmin = (function () {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!url || !key) return null as any
        return createClient<Database>(url, key)
    } catch {
        return null as any
    }
})()
