import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import type { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

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
 */
export async function checkAndConsumeQuota(
    actionType: QuotaAction,
    consume: boolean = false
): Promise<QuotaResult> {
    const supabase = createClient() as unknown as SupabaseClient<Database>

    // 1. Get User
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { allowed: false, reason: 'error', quota: 0, used: 0, creditsRemaining: 0 }
    }

    // 2. Get Subscription & Plan (strictly typed join)
    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
            *,
            plan:subscription_plans(features)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .maybeSingle()

    // 3. Determine Quota Limit
    let limit = 0
    if (subscription?.plan) {
        const features = subscription.plan.features as any // features is Json, need some flexibility here or cast to known interface
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
            .eq('created_by_user_id', user.id)
            .gte('created_at', startOfMonth)
        used = count || 0
    } else {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)

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
        .eq('user_id', user.id)
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
                p_user_id: user.id
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
 * Checks usage and sends warning email if >= 80%.
 */
export async function checkAndSendQuotaWarning(actionType: QuotaAction) {
    const supabase = createClient() as unknown as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`*, plan:subscription_plans(features)`)
        .eq('user_id', user.id)
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
            .eq('created_by_user_id', user.id)
            .gte('created_at', startOfMonth)
        used = count || 0
    } else {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)

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
        .eq('user_id', user.id)
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
        to: user.email || '',
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
