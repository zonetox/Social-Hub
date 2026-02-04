'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

interface ROIMetrics {
    opportunities: number
    offersSent: number
    requestsClosed: number
}

export async function getBusinessROIMetricsInternal(
    supabase: SupabaseClient<Database>,
    userId: string,
    timeRange: 'month' | 'all'
): Promise<ROIMetrics> {
    // 1. Get User's Profile & Category
    // We explicitly type the response to avoid 'never' inference issues with complex queries
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, category_id')
        .eq('user_id', userId)
        .single()

    // Proper type guard/casting using the Database definition
    const userProfile = profile as unknown as Pick<ProfileRow, 'id' | 'category_id'> | null

    if (!userProfile || !userProfile.category_id) {
        return { opportunities: 0, offersSent: 0, requestsClosed: 0 }
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startDate = timeRange === 'month' ? startOfMonth : '1970-01-01'

    // 2. Count Request Opportunities (In same Category & Open)
    const { count: opportunities } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', userProfile.category_id)
        .eq('status', 'open') // Sync with Frontend "Opportunities" view
        .gte('created_at', startDate)

    // 3. Count Offers Sent
    const { count: offersSent } = await supabase
        .from('service_offers')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userProfile.id)
        .gte('created_at', startDate)

    // 4. Count Requests Closed (Engagement)
    const { count: requestsClosed } = await supabase
        .from('service_offers')
        .select(`
            request_id,
            request:service_requests!inner(status, closed_at)
        `, { count: 'exact', head: true })
        .eq('profile_id', userProfile.id)
        .eq('request.status', 'closed')
        .gte('request.closed_at', startDate)

    return {
        opportunities: opportunities || 0,
        offersSent: offersSent || 0,
        requestsClosed: requestsClosed || 0
    }
}

export async function getBusinessROIMetrics(timeRange: 'month' | 'all'): Promise<ROIMetrics> {
    const supabase = createClient() as unknown as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { opportunities: 0, offersSent: 0, requestsClosed: 0 }

    return getBusinessROIMetricsInternal(supabase, user.id, timeRange)
}

