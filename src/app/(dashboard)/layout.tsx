'use client'

export const dynamic = 'force-dynamic'

import { ReactNode, useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Navbar } from '@/components/dashboard/Navbar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, loading, hasSession } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!hasSession && !loading) {
        redirect('/login')
    }

    // Self-healing: If session exists but public user record is missing
    if (!user && hasSession) {
        return <SelfHealingSync />
    }

    return (
        <div className="min-h-screen relative">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
                {/* Content background light effect */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 blur-[100px] -z-10 rounded-full" />
                {children}
            </main>
        </div>
    )
}

function SelfHealingSync() {
    const [status, setStatus] = useState<'initializing' | 'repairing' | 'failed'>('initializing')
    const [error, setError] = useState<string | null>(null)
    const { signOut } = useAuth()
    const supabase = createClient()

    useEffect(() => {
        const repairProfile = async () => {
            try {
                setStatus('repairing')
                const { data: { session } } = await supabase.auth.getSession()

                if (!session?.user?.id) {
                    console.error('[Self-Healing] No session found during repair')
                    throw new Error('No active session found. Please sign in again.')
                }

                console.log('[Self-Healing] Attempting to repair profile for:', session.user.id)

                const response = await fetch('/api/auth/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: session.user.id })
                })

                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.error || 'Failed to synchronize profile')
                }

                console.log('[Self-Healing] Profile repaired successfully. Reloading...')

                // Extra safety: wait 2s for DB replication before reload
                setTimeout(() => {
                    window.location.reload()
                }, 2000)

            } catch (err: any) {
                console.error('[Self-Healing] Recovery failed:', err.message)
                setStatus('failed')
                setError(err.message)
            }
        }

        repairProfile()
    }, [])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50/50 backdrop-blur-sm">
            <div className="bg-white/80 border border-white/20 backdrop-blur-xl rounded-[2.5rem] p-12 max-w-md w-full text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in duration-700">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary-500/20 rotate-3 transition-transform hover:rotate-0 duration-500">
                    {status === 'failed' ? (
                        <div className="text-white">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-12 h-12 border-[5px] border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                </div>

                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                    {status === 'failed' ? 'Heads up' : 'Setting things up'}
                </h2>

                <p className="text-gray-500 font-semibold leading-relaxed mb-10">
                    {status === 'failed'
                        ? (error || 'We hit a small snag while preparing your profile.')
                        : 'We are ensuring your digital identity is ready for your HUB experience. Just a few seconds...'
                    }
                </p>

                <div className="flex flex-col gap-4">
                    {status === 'failed' ? (
                        <>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-8 py-4 bg-primary-600 text-white rounded-[1.25rem] hover:bg-primary-700 transition-all font-black shadow-xl shadow-primary-500/20 active:scale-[0.98]"
                            >
                                Retry Setup
                            </button>
                            <button
                                onClick={() => signOut()}
                                className="w-full px-8 py-3 text-gray-400 hover:text-gray-600 font-bold transition-colors"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                            Optimizing Database...
                        </p>
                    )}
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100/50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-50">
                        Self-Healing System Active
                    </p>
                </div>
            </div>
        </div>
    )
}
