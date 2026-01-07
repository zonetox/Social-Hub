// @ts-nocheck - Supabase type inference issues
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
    const days = parseInt(searchParams.get('days') || '7')

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Access control: Only admins or profile owners can view analytics
    if (!profileId) {
        // Only admins can view global analytics if no profileId is provided
        const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single() as any
        if (user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    } else {
        const { data: profile } = await supabase.from('profiles').select('user_id').eq('id', profileId).single() as any
        if (profile?.user_id !== session.user.id) {
            const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single() as any
            if (user?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }
    }

    // Fetch analytics data
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (days * 2)) // Fetch 2 periods for comparison

    let query = supabase
        .from('analytics')
        .select('created_at, event_type')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

    if (profileId) {
        query = query.eq('profile_id', profileId)
    }

    const { data, error } = await query as any

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Process data into daily buckets and summary
    const midPoint = new Date()
    midPoint.setDate(midPoint.getDate() - days)
    const midPointIso = midPoint.toISOString()

    const dailyStats: Record<string, { views: number; clicks: number; date: string }> = {}
    let currentViews = 0
    let currentClicks = 0
    let previousViews = 0
    let previousClicks = 0

    // Initialize only the LAST X days for chartData
    for (let i = 0; i < days; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        dailyStats[dateStr] = { views: 0, clicks: 0, date: dateStr }
    }

    data.forEach((event: any) => {
        const dateStr = event.created_at.split('T')[0]
        const isCurrentPeriod = event.created_at >= midPointIso

        if (isCurrentPeriod) {
            if (event.event_type === 'view') currentViews++
            if (event.event_type === 'click') currentClicks++

            if (dailyStats[dateStr]) {
                if (event.event_type === 'view') dailyStats[dateStr].views++
                if (event.event_type === 'click') dailyStats[dateStr].clicks++
            }
        } else {
            if (event.event_type === 'view') previousViews++
            if (event.event_type === 'click') previousClicks++
        }
    })

    // Convert to sorted array for chart
    const chartData = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
        chartData,
        summary: {
            currentPeriod: { views: currentViews, clicks: currentClicks },
            previousPeriod: { views: previousViews, clicks: previousClicks },
            totalViews: currentViews, // For backward compatibility
            totalClicks: currentClicks // For backward compatibility
        }
    })
}
