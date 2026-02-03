'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import type { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

export type QuotaAction = 'create_request' | 'create_offer'

export interface QuotaResult {
    allowed: boolean
    reason?: 'quota_exceeded' | 'error' | 'no_subscription'
    source?: 'subscription' | 'credit'
    quota: number
    used: number
    creditsRemaining: number
}

/**
 * INTERNAL: Core quota logic (Shared between Action and API)
 */
export async function checkAndConsumeQuotaInternal(
    supabase: SupabaseClient<Database>,
    userId: string,
    actionType: QuotaAction,
    consume: boolean = false
): Promise<QuotaResult> {
    // 2. Get Subscription & Plan (strictly typed join)
    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
            *,
            plan:subscription_plans(features)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .maybeSingle()

    // 3. Determine Quota Limit
    let limit = 0
    if (subscription?.plan) {
        const features = subscription.plan.features as any
        if (actionType === 'create_request') {
            limit = (features as any)?.request_quota_per_month || 0
        } else {
            limit = (features as any)?.offer_quota_per_month || 0
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
            .eq('created_by_user_id', userId)
            .gte('created_at', startOfMonth)
        used = count || 0
    } else {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', userId)

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

    // Check Credits
    const { data: creditData } = await supabase
        .from('card_credits')
        .select('amount')
        .eq('user_id', userId)
        .maybeSingle()

    const creditsRemaining = creditData?.amount || 0

    // 5. Compare & Logic
    if (used < limit) {
        return {
            allowed: true,
            source: 'subscription',
            quota: limit,
            used,
            creditsRemaining
        }
    } else if (creditsRemaining > 0) {
        if (consume) {
            // Atomic Consume using RPC
            const { data: newAmount, error: rpcError } = await supabase.rpc('consume_credit', {
                p_user_id: userId
            })

            if (rpcError || newAmount === null || typeof newAmount !== 'number') {
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
                creditsRemaining: newAmount
            }
        } else {
            return {
                allowed: true,
                source: 'credit',
                quota: limit,
                used,
                creditsRemaining
            }
        }
    }

    return {
        allowed: false,
        reason: 'quota_exceeded',
        quota: limit,
        used,
        creditsRemaining
    }
}

/**
 * Exported Server Action
 */
export async function checkAndConsumeQuota(
    actionType: QuotaAction,
    consume: boolean = false
): Promise<QuotaResult> {
    const supabase = createClient() as unknown as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { allowed: false, reason: 'error', quota: 0, used: 0, creditsRemaining: 0 }
    }
    return checkAndConsumeQuotaInternal(supabase, user.id, actionType, consume)
}

/**
 * INTERNAL: Core warning logic
 */
export async function checkAndSendQuotaWarningInternal(
    supabase: SupabaseClient<Database>,
    userId: string,
    userEmail: string,
    actionType: QuotaAction
) {
    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`*, plan:subscription_plans(features)`)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

    if (!subscription?.plan?.features) return

    const features = subscription.plan.features as any
    let limit = (actionType === 'create_request')
        ? (features?.request_quota_per_month || 0)
        : (features?.offer_quota_per_month || 0)

    if (limit === 0) return

    // Calculate Usage
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    let used = 0

    if (actionType === 'create_request') {
        const { count } = await supabase
            .from('service_requests')
            .select('*', { count: 'exact', head: true })
            .eq('created_by_user_id', userId)
            .gte('created_at', startOfMonth)
        used = count || 0
    } else {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', userId)

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

    if (used < limit * 0.8) return

    const currentMonthStr = format(now, 'yyyy-MM')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

    if (!profile) return

    const { data: existingWarning } = await supabase
        .from('analytics')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('event_type', 'quota_warning_sent')
        .contains('metadata', { month: currentMonthStr, action: actionType })
        .maybeSingle()

    if (existingWarning) return

    // Send Email
    const typeName = actionType === 'create_request' ? 'gửi yêu cầu' : 'gửi báo giá'
    await sendEmail({
        to: userEmail,
        subject: `Cảnh báo: Bạn sắp hết lượt ${typeName} tháng này`,
        html: `
            <h1>Bạn đã sử dụng ${used}/${limit} lượt ${typeName}</h1>
            <p>Bạn đã đạt hơn 80% giới hạn gói của mình.</p>
            <p>Để tránh gián đoạn công việc, hãy cân nhắc nâng cấp gói VIP hoặc mua thêm Credit.</p>
            <br/>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/pricing" style="background-color: #F59E0B; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Nâng cấp ngay
            </a>
        `
    })

    await supabase.from('analytics').insert({
        profile_id: profile.id,
        event_type: 'quota_warning_sent',
        metadata: { month: currentMonthStr, action: actionType }
    })
}

/**
 * Exported Server Action
 */
export async function checkAndSendQuotaWarning(actionType: QuotaAction) {
    const supabase = createClient() as unknown as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) return
    return checkAndSendQuotaWarningInternal(supabase, user.id, user.email, actionType)
}
