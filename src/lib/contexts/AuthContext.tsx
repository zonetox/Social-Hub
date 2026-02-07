'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/user.types'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextType {
    user: User | null
    loading: boolean
    status: AuthStatus
    hasSession: boolean
    signOut: () => Promise<void>
    isAdmin: boolean
    error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [hasSession, setHasSession] = useState(false)
    const [status, setStatus] = useState<AuthStatus>('loading')
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()
    const mountedRef = useRef(true)

    const fetchProfile = async (userId: string, authUserEmail?: string): Promise<User | null> => {
        console.log('[Auth] profile fetch start for:', userId)
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (error) {
                console.error('[Auth] profile fetch failed:', error.message)
                // Even if profile fails, we don't throw everything away if we have a session.
                // But we log it clearly.
            } else {
                console.log('[Auth] profile fetch success:', data ? 'Found' : 'Not Found')
            }

            if (data) return data as unknown as User

            // STANDARD FALLBACK: Virtual User
            if (authUserEmail) {
                console.warn('[Auth] Profile missing, creating virtual user for UI')
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
        } catch (err) {
            console.error('[Auth] profile fetch exception:', err)
            return null
        }
    }

    useEffect(() => {
        mountedRef.current = true

        const initAuth = async () => {
            console.log('[Auth] Initializing authentication...')
            // Timeout Check
            const timeoutId = setTimeout(() => {
                if (mountedRef.current && status === 'loading') {
                    console.error('[Auth] Initialization timeout (3s)')
                    setStatus('unauthenticated')
                    setHasSession(false)
                    setError('Auth initialization timeout')
                }
            }, 3000)

            try {
                // 1. Get Session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError) {
                    console.error('[Auth] session error:', sessionError.message)
                    throw sessionError
                }

                console.log('[Auth] session:', session ? 'Active' : 'None')

                if (session?.user) {
                    if (mountedRef.current) setHasSession(true)

                    // 2. Fetch Profile (Decoupled)
                    const profileData = await fetchProfile(session.user.id, session.user.email)

                    if (mountedRef.current) {
                        setUser(profileData)
                        setStatus('authenticated')
                        setError(null)
                    }
                } else {
                    if (mountedRef.current) {
                        setStatus('unauthenticated')
                        setHasSession(false)
                        setUser(null)
                    }
                }
            } catch (err: any) {
                console.error('[Auth] init failed:', err)
                if (mountedRef.current) {
                    setStatus('unauthenticated')
                    setError(err.message)
                }
            } finally {
                clearTimeout(timeoutId)
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mountedRef.current) return
                console.log(`[Auth] Auth state changed: ${event}`)

                if (session?.user) {
                    setHasSession(true)
                    // Optimistic update to avoid flickering while fetching profile
                    setStatus('loading')
                    const profileData = await fetchProfile(session.user.id, session.user.email)
                    if (mountedRef.current) {
                        setUser(profileData)
                        setStatus('authenticated')
                    }
                } else {
                    setHasSession(false)
                    setUser(null)
                    setStatus('unauthenticated')
                }
            }
        )

        return () => {
            mountedRef.current = false
            subscription.unsubscribe()
        }
    }, [])

    const signOut = async () => {
        try {
            setStatus('loading')
            await supabase.auth.signOut()
            if (mountedRef.current) {
                setUser(null)
                setHasSession(false)
                setStatus('unauthenticated')
            }
        } catch (err) {
            console.error('[Auth] Sign out error', err)
            setStatus('unauthenticated') // Force logout state even on error
        }
    }

    const value = {
        user,
        loading: status === 'loading',
        status,
        hasSession,
        signOut,
        isAdmin: user?.role === 'admin',
        error
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
