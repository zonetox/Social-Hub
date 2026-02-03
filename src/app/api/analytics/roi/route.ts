import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessROIMetricsInternal } from '@/actions/analytics'
import type { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const { timeRange } = await req.json()
        const range = timeRange === 'all' ? 'all' : 'month'

        const supabase = createClient() as unknown as SupabaseClient<Database>

        // 1. Check Auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { opportunities: 0, offersSent: 0, requestsClosed: 0 },
                { status: 401 }
            )
        }

        // 2. Call Internal Logic
        const metrics = await getBusinessROIMetricsInternal(supabase, user.id, range)

        return NextResponse.json(metrics)
    } catch (error) {
        console.error('[API ROI] Error:', error)
        return NextResponse.json(
            { opportunities: 0, offersSent: 0, requestsClosed: 0 },
            { status: 500 }
        )
    }
}
