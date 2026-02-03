
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export const createServerClient = () => {
    // Returns typed client
    return createServerComponentClient<Database>({ cookies })
}

export const createClient = createServerClient
