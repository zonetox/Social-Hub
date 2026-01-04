'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
    const supabase = createClient()

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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // Only set loading if it's not already loading and it's a sign-in event
                // to avoid flickering on every state change if data is already there.
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    // We stay in loading(true) which is the default
                }

                try {
                    if (session?.user) {
                        setHasSession(true)
                        const userData = await fetchUser(session.user.id)
                        if (mounted) setUser(userData)
                    } else {
                        setHasSession(false)
                        if (mounted) setUser(null)
                    }
                } catch (error) {
                    console.error('Auth state change error:', error)
                } finally {
                    if (mounted) setLoading(false)
                }
            }
        )

        // As a fallback, ensure loading is set to false after a timeout 
        // if anything goes wrong with Supabase's initial response
        const timeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth initialization timed out, forcing loading to false')
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
