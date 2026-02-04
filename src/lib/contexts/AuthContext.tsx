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

    const fetchUser = async (userId: string, authUserEmail?: string, retries = 1): Promise<User | null> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (error) {
                console.warn(`[Auth] Error fetching user record:`, error.message)
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    return fetchUser(userId, authUserEmail, retries - 1)
                }
            }

            if (data) return data as unknown as User

            // STANDARD FALLBACK: If public record is missing, return a virtual user
            // This prevents the UI from blocking or crashing.
            if (authUserEmail) {
                console.log('[Auth] Creating virtual user for:', authUserEmail)
                return {
                    id: userId,
                    email: authUserEmail,
                    full_name: authUserEmail.split('@')[0],
                    username: authUserEmail.split('@')[0] + '-' + userId.substring(0, 4),
                    role: 'user',
                    is_active: true
                } as User
            }

            return null
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
                    const userData = await fetchUser(session.user.id, session.user.email)
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
                    const userData = await fetchUser(session.user.id, session.user.email)
                    if (mounted) setUser(userData)
                } else {
                    setHasSession(false)
                    setUser(null)
                }

                setLoading(false)
            }
        )

        // As a fallback, ensure loading is set to false after a timeout 
        // Reduced to 5s to prevent infinite loading perception
        const timeout = setTimeout(() => {
            if (mounted && loadingRef.current) {
                console.warn('[Auth] Initialization timed out after 5s, forcing loading to false')
                setLoading(false)
            }
        }, 5000)

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

export const useAuth = useAuthContext
