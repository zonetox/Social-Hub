// @ts-nocheck - Supabase type inference issues
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = createServerClient()
    const body = await request.json()

    // Analytics are public, but we might want to rate limit or validate here
    const { block_ip } = body
    if (block_ip) {
        // Basic spam prevention (placeholder)
        return NextResponse.json({ error: 'Blocked' }, { status: 403 })
    }

    const { data, error } = await supabase
        .from('analytics')
        .insert(body as any)
        .select()
        .single() as any

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger increment functions via RPC if needed, but the DB trigger might handle some
    if (body.event_type === 'view') {
        // @ts-ignore
        await supabase.rpc('increment_profile_views', { profile_id: body.profile_id })
    } else if (body.event_type === 'click' && body.social_account_id) {
        // @ts-ignore
        await supabase.rpc('increment_social_click', { account_id: body.social_account_id })
    }

    return NextResponse.json({ event: data })
}

export async function GET(request: Request) {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId')

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Access control: Only admins or profile owners can view full analytics
    if (profileId) {
        const { data: profile } = await supabase.from('profiles').select('user_id').eq('id', profileId).single() as any
        if (profile?.user_id !== session.user.id) {
            // Check if admin
            const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single() as any
            if (user?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }
    } else {
        // Only admins can view global analytics
        const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single() as any
        if (user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    }

    // ... Implementation for fetching analytics data would go here
    // For now returning simple success as more complex queries might be needed
    return NextResponse.json({ message: 'Analytics endpoint ready' })
}
