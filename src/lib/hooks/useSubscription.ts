'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import type { UserSubscription } from '@/types/payment.types'

export function useSubscription() {
    const { user } = useAuth()
    const [subscription, setSubscription] = useState<UserSubscription | null>(null)
    const [cardBalance, setCardBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (user) {
            fetchSubscription()
            fetchCardBalance()
        } else {
            setSubscription(null)
            setCardBalance(0)
            setLoading(false)
        }
    }, [user])

    const fetchSubscription = async () => {
        if (!user) return

        try {
            const { data, error } = await supabase
                .from('user_subscriptions')
                .select('*, plan:subscription_plans(*)')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('expires_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (data) {
                setSubscription(data as unknown as UserSubscription)
            } else {
                setSubscription(null)
            }
        } catch (error) {
            console.error('Fetch subscription error:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchCardBalance = async () => {
        if (!user) return

        try {
            const { data, error } = await (supabase as any).rpc('get_user_card_balance', {
                p_user_id: user.id
            })

            if (!error) {
                setCardBalance(data || 0)
            }
        } catch (error) {
            console.error('Fetch card balance error:', error)
        }
    }

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
        isSubscribed: isSubscribed(),
        canSendCard: canSendCard(),
        refreshSubscription: fetchSubscription,
        refreshBalance: fetchCardBalance,
    }
}
