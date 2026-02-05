'use client'

import { ReactNode, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { redirect } from 'next/navigation'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { loading, hasSession } = useAuth()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
        <div className="min-h-screen bg-gray-50 flex overflow-hidden">
            {/* Left Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Top Header */}
                <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar relative">
                    {/* Floating Background Effects */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 blur-[120px] -z-10 rounded-full animate-pulse" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
