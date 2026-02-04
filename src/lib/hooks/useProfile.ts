'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, SocialAccount } from '@/types/user.types'

export function useProfile(userId?: string) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        let timeoutId: NodeJS.Timeout

        const fetchProfile = async () => {
            try {
                // Set a timeout to prevent infinite loading
                timeoutId = setTimeout(() => {
                    console.warn('[useProfile] Query timeout after 10s')
                    setError('Profile loading timed out')
                    setLoading(false)
                }, 10000)

                const { data, error } = await supabase
                    .from('profiles')
                    .select(`
            *,
            user:users(*),
            social_accounts(*)
          `)
                    .eq('user_id', userId)
                    .maybeSingle() as any

                clearTimeout(timeoutId)

                if (error) throw error

                // Sort social accounts by display_order
                if (data?.social_accounts) {
                    data.social_accounts.sort((a: SocialAccount, b: SocialAccount) =>
                        a.display_order - b.display_order
                    )
                }

                setProfile(data)
            } catch (err: any) {
                clearTimeout(timeoutId)
                setError(err.message)
                console.error('[useProfile] Error:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()

        return () => {
            clearTimeout(timeoutId)
        }
    }, [userId])

    const refreshProfile = async () => {
        if (!userId) return

        setLoading(true)
        const { data } = await supabase
            .from('profiles')
            .select(`
        *,
        user:users(*),
        social_accounts(*)
      `)
            .eq('user_id', userId)
            .maybeSingle() as any

        if (data?.social_accounts) {
            data.social_accounts.sort((a: SocialAccount, b: SocialAccount) =>
                a.display_order - b.display_order
            )
        }

        setProfile(data)
        setLoading(false)
    }

    return { profile, loading, error, refreshProfile }
}
