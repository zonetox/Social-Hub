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

    const fetchUser = async (userId: string, retries = 2): Promise<User | null> => {
        try {
            console.log(`[Auth] Fetching user ${userId} (retries remaining: ${retries})...`)
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (error) {
                console.warn(`[Auth] Error fetching user record (attempt ${3 - retries}/3):`, error.message)
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    return fetchUser(userId, retries - 1)
                }
                return null
            }
            if (!data) {
                console.warn('[Auth] User record not found in public.users table.')
            }
            return (data as unknown as User) || null
        } catch (error) {
            console.error('[Auth] Unexpected error during fetchUser:', error)
            return null
        }
    }

    useEffect(() => {
        let mounted = true

        const initAuth = async () => {
            try {
                console.log('[Auth] Initializing authentication...')
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError) {
                    console.error('[Auth] Session error:', sessionError.message)
                    throw sessionError
                }

                if (session?.user) {
                    setHasSession(true)
                    console.log('[Auth] Session found, fetching public user data...')
                    const userData = await fetchUser(session.user.id)
                    if (mounted) setUser(userData)
                } else {
                    console.log('[Auth] No active session found.')
                }
            } catch (error) {
                console.error('[Auth] Initialization failed:', error)
            } finally {
                if (mounted) {
                    console.log('[Auth] Initialization complete.')
                    setLoading(false)
                }
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return
                console.log(`[Auth] Auth state changed: ${event}`)

                if (session?.user) {
                    setHasSession(true)
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
        // INCREASED to 20s for slow connections
        const timeout = setTimeout(() => {
            if (mounted && loadingRef.current) {
                console.warn('[Auth] Initialization timed out after 20s, forcing loading to false')
                setLoading(false)
            }
        }, 20000)

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
