'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

interface ROIMetrics {
    opportunities: number
    offersSent: number
    requestsClosed: number
}

export async function getBusinessROIMetrics(timeRange: 'month' | 'all'): Promise<ROIMetrics> {
    const supabase = createClient(cookies())
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { opportunities: 0, offersSent: 0, requestsClosed: 0 }

    // 1. Get User's Profile & Category
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, category_id')
        .eq('user_id', user.id)
        .single()

    if (!profile || !profile.category_id) {
        return { opportunities: 0, offersSent: 0, requestsClosed: 0 }
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startDate = timeRange === 'month' ? startOfMonth : '1970-01-01'

    // 2. Count Request Opportunities (In same Category)
    // "Requests in category (opportunities seen)"
    const { count: opportunities } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', profile.category_id)
        .gte('created_at', startDate)

    // 3. Count Offers Sent
    const { count: offersSent } = await supabase
        .from('service_offers')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id)
        .gte('created_at', startDate)

    // 4. Count Requests Closed (Engagement)
    // "Requests closed" -> requests I offered on that are closed? 
    // Or just any closed request in my category?
    // User Query:
    // SELECT COUNT(*) FROM service_requests sr
    // JOIN service_offers so ON so.request_id = sr.id
    // JOIN profiles p ON p.id = so.profile_id
    // WHERE p.user_id = auth.uid() AND sr.status = 'closed';
    // Matches "Engagement" -> Successful/Closed deals involving me (or at least where I participated).
    // Note: User prompt implies requests I offered to that ended up closed (whether I won or not, or maybe just 'closed' status implies completion).
    // Let's implement the Join via Supabase syntax.

    const { count: requestsClosed } = await supabase
        .from('service_offers') // Start from offers (mine)
        .select(`
            request_id,
            request:service_requests!inner(status)
        `, { count: 'exact', head: true })
        .eq('profile_id', profile.id)
        .eq('request.status', 'closed') // Filter on joined table
        // Time range? "requests closed". Time of closure? Or time of offer?
        // Prompt SQL: `AND sr.status = 'closed'`. It didn't specify timestamp filter on SR. 
        // But the previous queries had `AND so.created_at >= ...` (for offers).
        // Let's assume we filter offers by date (my activity period) usually.
        // OR filtering by closure date?
        // The prompt SQL for the 3rd query:
        // `WHERE p.user_id = auth.uid() AND sr.status = 'closed'`
        // It DOES NOT have a date filter in the prompt snippet for the 3rd query?
        // Wait, "Metrics to show (per month + all time)".
        // So I should apply date filter.
        // On created_at of REQUEST or OFFER?
        // Usually ROI is "This month's performance". 
        // Let's filter by `service_requests.closed_at` if available, or just `service_offers.created_at` (activity).
        // `service_requests` table has `closed_at`.
        // If timeRange === month, maybe we check `closed_at >= startDate`.
        .gte('request.closed_at', startDate) // If closed_at is used.

    // Note: Supabase JS filter on joined table: .eq('request.status', 'closed') works if !inner is used.
    // .gte('request.closed_at', startDate) works too.

    return {
        opportunities: opportunities || 0,
        offersSent: offersSent || 0,
        requestsClosed: requestsClosed || 0
    }
}
