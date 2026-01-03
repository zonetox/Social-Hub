// @ts-nocheck - Supabase type inference issues
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = createServerClient()

    const { data: user, error } = await supabase
        .from('users')
        .select('*, profile:profiles(*)')
        .eq('id', params.id)
        .single() as any

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ user })
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = createServerClient()
    const body = await request.json()

    // Get current user
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can edit (must be self or admin)
    if (session.user.id !== params.id) {
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single() as any

        if (user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    }

    const { data, error } = await supabase
        .from('users')
        .update(body as any)
        .eq('id', params.id)
        .select()
        .single() as any

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data })
}
