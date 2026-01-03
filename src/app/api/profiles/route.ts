// @ts-nocheck - Supabase type inference issues
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    let query = supabase.from('profiles').select('*, user:users(*)')

    if (username) {
        // If username is provided, we need to join with users table to filter
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single() as any

        if (user) {
            query = query.eq('user_id', user.id)
        } else {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
    }

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profiles: data })
}

export async function PUT(request: Request) {
    const supabase = createServerClient()
    const body = await request.json()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user is updating their own profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single() as any

    if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // @ts-expect-error - Supabase type inference issue
    const { data, error } = await supabase
        .from('profiles')
        .update(body as any)
        .eq('id', profile.id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
}
