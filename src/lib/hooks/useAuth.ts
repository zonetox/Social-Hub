'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/user.types'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [hasSession, setHasSession] = useState(false)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user) {
                    setHasSession(true)
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single() as any

                    if (error) {
                        console.error('Error fetching user record:', error)
                        setUser(null)
                    } else {
                        setUser(data)
                    }
                } else {
                    setUser(null)
                }
            } catch (error) {
                console.error('Auth check failed:', error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    try {
                        const { data, error } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', session.user.id)
                            .single() as any

                        if (!error) {
                            setHasSession(true)
                            setUser(data)
                        } else {
                            setHasSession(true)
                            setUser(null)
                        }
                    } catch (e) {
                        setHasSession(true)
                        setUser(null)
                    }
                } else {
                    setHasSession(false)
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
        setHasSession(false)
        setUser(null)
    }

    return { user, loading, hasSession, signOut, isAdmin: user?.role === 'admin' }
}
