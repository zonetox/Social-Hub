import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndConsumeQuotaInternal } from '@/actions/quota'
import type { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const { action, consume } = await req.json()

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 })
        }

        const supabase = createClient() as unknown as SupabaseClient<Database>
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ allowed: false, reason: 'error' }, { status: 401 })
        }

        const result = await checkAndConsumeQuotaInternal(
            supabase,
            user.id,
            action,
            consume || false
        )

        return NextResponse.json(result)
    } catch (error) {
        console.error('[API Quota Check] Error:', error)
        return NextResponse.json({ allowed: false, reason: 'error' }, { status: 500 })
    }
}
