'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/email/resend'

type QuotaAction = 'create_request' | 'create_offer'

interface QuotaResult {
    allowed: boolean
    reason?: 'quota_exceeded' | 'error' | 'no_subscription'
    source?: 'subscription' | 'credit'
    quota: number
    used: number
    creditsRemaining: number
}

/**
 * Checks quota and optionally consumes usage (or credit).
 * Note: Subscription quota is "soft" (counted by rows), Credit is "hard" (decremented).
 */
export async function checkAndConsumeQuota(
    actionType: QuotaAction,
    consume: boolean = false
): Promise<QuotaResult> {
    const supabase = createClient()

    // 1. Get User
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { allowed: false, reason: 'error', quota: 0, used: 0, creditsRemaining: 0 }
    }

    // 2. Get Subscription & Plan
    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
            *,
            plan:subscription_plans(features)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .single()

    // Cast to any to avoid TS errors with joins not in types
    const subData = subscription as any

    // 3. Determine Quota Limit
    let limit = 0
    if (subData?.plan?.features) {
        const features = subData.plan.features as any
        if (actionType === 'create_request') {
            limit = features.request_quota_per_month || 0
        } else {
            limit = features.offer_quota_per_month || 0
        }
    }

    // 4. Calculate Usage (Current Month)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    let used = 0

    if (actionType === 'create_request') {
        const { count } = await supabase
            .from('service_requests')
            .select('*', { count: 'exact', head: true })
            .eq('created_by_user_id', user.id)
            .gte('created_at', startOfMonth)
        used = count || 0
    } else {
        // Offer usage check
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .returns<{ id: string }[]>()

        const profileIds = profiles?.map(p => p.id) || []

        if (profileIds.length > 0) {
            const { count } = await supabase
                .from('service_offers')
                .select('*', { count: 'exact', head: true })
                .in('profile_id', profileIds)
                .gte('created_at', startOfMonth)
            used = count || 0
        }
    }

    // Check Credits (for info)
    const { data: creditData } = await supabase
        .from('card_credits')
        .select('amount')
        .eq('user_id', user.id)
        .returns<{ amount: number }>() // Keep returns but also cast to be safe
        .maybeSingle()

    // Fix: Explicitly cast creditData to handle persistent 'never' inference
    const creditsRemaining = (creditData as { amount: number } | null)?.amount || 0

    // 5. Compare & Logic
    if (used < limit) {
        // Allowed by Subscription Quota
        return {
            allowed: true,
            source: 'subscription',
            quota: limit,
            used,
            creditsRemaining
        }
    } else {
        // Sub Quota Exceeded. Check Credits.
        if (creditsRemaining > 0) {
            if (consume) {
                // Atomic Consume - Use bypass pattern for RPC as per Manual
                const supabaseAny: any = supabase

                const { data: newAmount, error: rpcError } = await supabaseAny.rpc('consume_credit', {
                    p_user_id: user.id
                })

                if (rpcError || newAmount === null) {
                    console.error('Credit consumption failed:', rpcError)
                    return {
                        allowed: false,
                        reason: 'quota_exceeded',
                        quota: limit,
                        used,
                        creditsRemaining
                    }
                }

                return {
                    allowed: true,
                    source: 'credit',
                    quota: limit,
                    used,
                    creditsRemaining: newAmount // Updated amount
                }
            } else {
                // Just checking, allow if credits exist
                return {
                    allowed: true,
                    source: 'credit',
                    quota: limit,
                    used,
                    creditsRemaining
                }
            }
        }
    }

    // Blocked
    return {
        allowed: false,
        reason: 'quota_exceeded',
        quota: limit,
        used,
        creditsRemaining
    }
}

/**
 * Checks if usage is >= 80% and sends a warning email if not already sent this month.
 * Should be called asynchronously after a successful action.
 */
export async function checkAndSendQuotaWarning(actionType: QuotaAction) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 2. Get Subscription (Redundant but safe)
    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`*, plan:subscription_plans(features)`)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

    // Cast to any (Subscription joins are complex to type strictly without full plan types)
    // This is acceptable as 'any' scope is strictly limited to this specific join parsing
    const subData = subscription as any

    if (!subData?.plan?.features) return

    const features = subData.plan.features as any
    let limit = 0
    if (actionType === 'create_request') limit = features.request_quota_per_month || 0
    else limit = features.offer_quota_per_month || 0

    if (limit === 0) return

    // Calculate Usage
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    let used = 0

    if (actionType === 'create_request') {
        const { count } = await supabase
            .from('service_requests')
            .select('*', { count: 'exact', head: true })
            .eq('created_by_user_id', user.id)
            .gte('created_at', startOfMonth)
        used = count || 0
    } else {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .returns<{ id: string }[]>()

        const profileIds = profiles?.map(p => p.id) || []
        if (profileIds.length > 0) {
            const { count } = await supabase
                .from('service_offers')
                .select('*', { count: 'exact', head: true })
                .in('profile_id', profileIds)
                .gte('created_at', startOfMonth)
            used = count || 0
        }
    }

    // Check Threshold (>= 80%)
    if (used < limit * 0.8) return

    // Check if Warning Sent
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` // YYYY-MM

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .returns<{ id: string }>()
        .limit(1)
        .maybeSingle()

    if (!profile) return

    const { data: existingWarning } = await supabase
        .from('analytics')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('event_type', 'quota_warning_sent')
        .contains('metadata', { month: currentMonthStr, action: actionType })
        .maybeSingle()

    if (existingWarning) return // Already sent

    // Send Email
    const typeName = actionType === 'create_request' ? 'gửi yêu cầu' : 'gửi báo giá'
    await sendEmail(
        user.email || '',
        `Cảnh báo: Bạn sắp hết lượt ${typeName} tháng này`,
        `
        <h1>Bạn đã sử dụng ${used}/${limit} lượt ${typeName}</h1>
        <p>Bạn đã đạt hơn 80% giới hạn gói của mình.</p>
        <p>Để tránh gián đoạn công việc, hãy cân nhắc nâng cấp gói VIP hoặc mua thêm Credit.</p>
        <br/>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/pricing" style="background-color: #F59E0B; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Nâng cấp ngay
        </a>
        `
    )

    // Log Event - Use any cast for insert to avoid strict checks on JSON metadata
    await (supabase.from('analytics') as any).insert({
        profile_id: profile.id,
        event_type: 'quota_warning_sent',
        metadata: { month: currentMonthStr, action: actionType },
        created_at: new Date().toISOString()
    })
}
