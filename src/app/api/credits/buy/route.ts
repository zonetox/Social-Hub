import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initiateCreditPurchaseInternal } from '@/actions/credits'
import type { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const { packageId, credits, amountVnd, proofUrl } = await req.json()

        const supabase = createClient() as unknown as SupabaseClient<Database>

        // 1. Check Auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            )
        }

        // 2. Call Internal Logic
        const result = await initiateCreditPurchaseInternal(
            supabase,
            user.id,
            packageId,
            credits,
            amountVnd,
            proofUrl
        )

        return NextResponse.json(result)
    } catch (error) {
        console.error('[API Credits Buy] Error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
