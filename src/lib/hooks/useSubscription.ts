'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import type { UserSubscription } from '@/types/payment.types'

export function useSubscription() {
    const { user } = useAuth()
    const [subscription, setSubscription] = useState<UserSubscription | null>(null)
    const [cardBalance, setCardBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const fetchSubscription = useCallback(async () => {
        if (!user) {
            setLoading(false)
            return
        }

        let timeoutId: NodeJS.Timeout | null = null
        try {
            setLoading(true)
            setError(null)

            // CTO Requirement: 7s timeout
            timeoutId = setTimeout(() => {
                console.warn('[useSubscription] Query timeout after 7s')
                setError('Hệ thống phản hồi chậm.')
                setLoading(false)
            }, 7000)

            const { data, error: fetchError } = await supabase
                .from('user_subscriptions')
                .select('*, plan:subscription_plans(*)')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('expires_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (fetchError) throw fetchError

            if (data) {
                setSubscription(data as unknown as UserSubscription)
            } else {
                setSubscription(null)
            }
        } catch (err: any) {
            console.error('Fetch subscription error:', err)
            setError(err.message)
        } finally {
            if (timeoutId) clearTimeout(timeoutId)
            setLoading(false)
        }
    }, [user, supabase])

    const fetchCardBalance = useCallback(async () => {
        if (!user) return

        try {
            const { data, error: rpcError } = await (supabase as any).rpc('get_user_card_balance', {
                p_user_id: user.id
            })

            if (rpcError) throw rpcError
            setCardBalance(data || 0)
        } catch (err) {
            console.error('Fetch card balance error:', err)
        }
    }, [user, supabase])

    useEffect(() => {
        if (user) {
            fetchSubscription()
            fetchCardBalance()
        } else {
            setSubscription(null)
            setCardBalance(0)
            setLoading(false)
        }
    }, [user, fetchSubscription, fetchCardBalance])

    const isSubscribed = () => {
        if (!subscription) return false
        return new Date(subscription.expires_at) > new Date()
    }

    const canSendCard = () => {
        return cardBalance > 0
    }

    return {
        subscription,
        cardBalance,
        loading,
        error,
        isSubscribed: isSubscribed(),
        canSendCard: canSendCard(),
        refreshSubscription: fetchSubscription,
        refreshBalance: fetchCardBalance,
    }
}
