'use client'

export const dynamic = 'force-dynamic'

import { ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Navbar } from '@/components/dashboard/Navbar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { redirect } from 'next/navigation'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, loading, hasSession, signOut } = useAuth()

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

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-800 mb-2">Hồ sơ không tìm thấy</h2>
                    <p className="text-red-700 mb-6 font-medium">
                        Bạn đã đăng nhập nhưng chúng tôi không tìm thấy thông tin hồ sơ của bạn trong hệ thống.
                    </p>
                    <p className="text-sm text-red-600 mb-8">
                        Lỗi này thường xảy ra khi bạn đã có tài khoản đăng nhập nhưng quá trình tạo hồ sơ bị lỗi (do thiếu quyền SQL).
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => signOut()}
                            className="w-full px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-sm"
                        >
                            Đăng xuất và thử lại
                        </button>
                        <p className="text-[10px] text-gray-500 mt-2">
                            Lưu ý: Bạn phải chạy mã SQL sửa lỗi trước khi thử đăng ký/đăng nhập lại.
                        </p>
                    </div>
                </div>
            </div>
        )
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
