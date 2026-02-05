'use client'

export const dynamic = 'force-dynamic'

import { ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Navbar } from '@/components/dashboard/Navbar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { redirect } from 'next/navigation'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { loading, hasSession } = useAuth()

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
