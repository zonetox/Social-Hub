import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRecommendedRequestsInternal } from '@/actions/recommendations'
import type { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const { limit } = await req.json().catch(() => ({ limit: 5 }))
        const requestLimit = limit || 5

        const supabase = createClient() as unknown as SupabaseClient<Database>

        // 1. Check Auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                [],
                { status: 401 }
            )
        }

        // 2. Call Internal Logic
        const recommendations = await getRecommendedRequestsInternal(supabase, user.id, requestLimit)

        return NextResponse.json(recommendations)
    } catch (error) {
        console.error('[API Recommendations] Error:', error)
        return NextResponse.json(
            [],
            { status: 500 }
        )
    }
}
