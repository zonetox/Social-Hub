'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/user.types'

interface AuthContextType {
    user: User | null
    loading: boolean
    hasSession: boolean
    signOut: () => Promise<void>
    isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [hasSession, setHasSession] = useState(false)
    const [loading, setLoading] = useState(true)
    const loadingRef = useRef(true)
    const supabase = createClient()

    // Sync ref with state
    useEffect(() => {
        loadingRef.current = loading
    }, [loading])

    const fetchUser = async (userId: string, retries = 3): Promise<User | null> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (error) {
                console.warn(`Error fetching user record (attempt ${4 - retries}/3):`, error.message)
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 500))
                    return fetchUser(userId, retries - 1)
                }
                return null
            }
            return (data as unknown as User) || null
        } catch (error) {
            console.error('Auth check failed:', error)
            return null
        }
    }

    useEffect(() => {
        let mounted = true

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    setHasSession(true)
                    const userData = await fetchUser(session.user.id)
                    // If we have a session but CANNOT get the user from public.users, 
                    // we still set hasSession to true (because they are authed),
                    // but user is null. This triggers the "Profile Not Found" UI.
                    // The retry logic above helps minimize false positives.
                    if (mounted) setUser(userData)
                }
            } catch (error) {
                console.error('Initial session fetch error:', error)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return

                if (session?.user) {
                    setHasSession(true)
                    // Always try to fetch updated user data on auth change
                    const userData = await fetchUser(session.user.id)
                    if (mounted) setUser(userData)
                } else {
                    setHasSession(false)
                    setUser(null)
                }

                setLoading(false)
            }
        )

        // As a fallback, ensure loading is set to false after a timeout 
        // if anything goes wrong with Supabase's initial response
        const timeout = setTimeout(() => {
            if (mounted && loadingRef.current) {
                console.warn('Auth initialization timed out, forcing loading to false')
                setLoading(false)
            }
        }, 10000)

        return () => {
            mounted = false
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [])

    const signOut = async () => {
        try {
            setLoading(true)
            await supabase.auth.signOut()
            setUser(null)
            setHasSession(false)
        } finally {
            setLoading(false)
        }
    }

    const value = {
        user,
        loading,
        hasSession,
        signOut,
        isAdmin: user?.role === 'admin'
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuthContext() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider')
    }
    return context
}
