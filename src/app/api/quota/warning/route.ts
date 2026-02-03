import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndSendQuotaWarningInternal } from '@/actions/quota'
import type { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const { action } = await req.json()

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 })
        }

        const supabase = createClient() as unknown as SupabaseClient<Database>
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
            return NextResponse.json({ success: false }, { status: 401 })
        }

        await checkAndSendQuotaWarningInternal(
            supabase,
            user.id,
            user.email,
            action
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API Quota Warning] Error:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
