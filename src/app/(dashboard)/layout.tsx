'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Navbar } from '@/components/dashboard/Navbar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { redirect } from 'next/navigation'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, loading, hasSession } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!hasSession) {
        redirect('/login')
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-800 mb-2">Hồ sơ không tìm thấy</h2>
                    <p className="text-red-700 mb-6">
                        Bạn đã đăng nhập nhưng chúng tôi không tìm thấy thông tin hồ sơ của bạn.
                        Điều này có thể do lỗi chính sách cơ sở dữ liệu (RLS).
                    </p>
                    <p className="text-sm text-red-600 mb-6">
                        Vui lòng liên hệ Admin hoặc thử đăng xuất và đăng ký lại sau khi lỗi SQL đã được sửa.
                    </p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Quay lại Đăng nhập
                    </button>
                </div>
            </div>
        )
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
