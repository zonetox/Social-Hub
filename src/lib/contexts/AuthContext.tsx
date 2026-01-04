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
                console.error('Error fetching user record:', error)
                return null
            }
            return data as User
        } catch (error) {
            console.error('Auth check failed:', error)
            return null
        }
    }

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user) {
                    setHasSession(true)
                    const userData = await fetchUser(session.user.id)
                    setUser(userData)
                } else {
                    setHasSession(false)
                    setUser(null)
                }
            } catch (error) {
                console.error('Initial session check failed:', error)
            } finally {
                setLoading(false)
            }
        }

        initializeAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setLoading(true)
                if (session?.user) {
                    setHasSession(true)
                    const userData = await fetchUser(session.user.id)
                    setUser(userData)
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
        setLoading(true)
        await supabase.auth.signOut()
        setHasSession(false)
        setUser(null)
        setLoading(false)
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
