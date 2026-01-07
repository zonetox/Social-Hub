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

    const fetchUser = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.warn('Error fetching user record (might be sync delay):', error)
                return null
            }
            return data as User
        } catch (error) {
            console.error('Auth check failed:', error)
            return null
        }
    }

    useEffect(() => {
        let mounted = true

        // Try to get initial session immediately to avoid unnecessary loading(true)
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    setHasSession(true)
                    const userData = await fetchUser(session.user.id)
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
                    // Only fetch user if the user ID changed or we don't have it yet
                    if (!user || user.id !== session.user.id) {
                        const userData = await fetchUser(session.user.id)
                        if (mounted) setUser(userData)
                    }
                } else {
                    setHasSession(false)
                    setUser(null)
                }

                // Always ensure loading is false after a state change
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
