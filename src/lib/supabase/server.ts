
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export const createServerClient = () => {
    // Returns typed client
    return createServerComponentClient<Database>({ cookies })
}

export const createClient = createServerClient
