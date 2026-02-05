'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, SocialAccount } from '@/types/user.types'

export function useProfile(userId?: string) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const fetchProfile = useCallback(async () => {
        if (!userId) {
            setLoading(false)
            return
        }

        let timeoutId: NodeJS.Timeout | null = null

        try {
            setLoading(true)
            setError(null)

            // Strict CTO Requirement: 7s timeout
            timeoutId = setTimeout(() => {
                console.warn('[useProfile] Query timeout after 7s')
                setError('Hệ thống phản hồi chậm. Vui lòng thử lại.')
                setLoading(false)
            }, 7000)

            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    user:users(*),
                    social_accounts(*)
                `)
                .eq('user_id', userId)
                .maybeSingle() as any

            if (fetchError) throw fetchError

            // Sort social accounts by display_order
            if (data?.social_accounts) {
                data.social_accounts.sort((a: SocialAccount, b: SocialAccount) =>
                    a.display_order - b.display_order
                )
            }

            setProfile(data)
        } catch (err: any) {
            console.error('[useProfile] Error:', err)
            setError(err.message || 'Không thể tải thông tin hồ sơ.')
        } finally {
            if (timeoutId) clearTimeout(timeoutId)
            setLoading(false)
        }
    }, [userId, supabase])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    return {
        profile,
        loading,
        error,
        refreshProfile: fetchProfile
    }
}
