'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Navbar } from '@/components/dashboard/Navbar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { redirect } from 'next/navigation'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
