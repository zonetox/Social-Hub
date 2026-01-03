'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/user.types'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.user) {
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single() as any

                setUser(data)
            }

            setLoading(false)
        }

        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    const { data } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()

                    setUser(data)
                } else {
                    setUser(null)
                }
                setLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    return { user, loading, signOut, isAdmin: user?.role === 'admin' }
}
