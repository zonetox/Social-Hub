'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

export interface RecommendedRequest {
    id: string
    title: string
    description: string
    created_at: string
    category_id: string
    category_name?: string
    budget?: number
}

export async function getRecommendedRequests(limit: number = 5): Promise<RecommendedRequest[]> {
    const supabase = createClient() as unknown as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // 1. Get User's First Profile & Category
    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            id,
            category_id,
            category:profile_categories(name)
        `)
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile || !profile.category_id) return []

    // 2. Get IDs of requests user ALREADY offered
    const { data: existingOffers } = await supabase
        .from('service_offers')
        .select('request_id')
        .eq('profile_id', profile.id)

    const offeredRequestIds = existingOffers?.map((o) => o.request_id) || []

    // 3. Query Recommendations
    // Rule: Same Category, Open Status, Created within 7 days, Not offered yet
    let query = supabase
        .from('service_requests')
        .select(`
            id,
            title,
            description,
            created_at,
            category_id,
            category:profile_categories(name)
        `)
        .eq('category_id', profile.category_id)
        .eq('status', 'open')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)

    if (offeredRequestIds.length > 0) {
        query = query.not('id', 'in', `(${offeredRequestIds.join(',')})`)
    }

    const { data: recommendations, error } = await query

    if (error) {
        console.error('Error fetching recommendations:', error)
        return []
    }

    return (recommendations || []).map((req) => ({
        id: req.id,
        title: req.title,
        description: req.description,
        created_at: req.created_at || '',
        category_id: req.category_id,
        category_name: (req.category as any)?.name
    }))
}
