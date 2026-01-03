// @ts-nocheck - Supabase type inference issues
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId')

    if (!profileId) {
        return NextResponse.json({ error: 'Profile ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('profile_id', profileId)
        .order('display_order', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ accounts: data })
}

export async function POST(request: Request) {
    const supabase = createServerClient()
    const body = await request.json()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify profile ownership
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single() as any

    if (!profile || profile.id !== body.profile_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
        .from('social_accounts')
        .insert(body as any)
        .select()
        .single() as any

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ account: data })
}
