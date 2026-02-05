'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/shared/Logo'
import {
    Menu,
    X,
    User,
    LogOut,
    Sparkles,
    LayoutDashboard,
    Building2,
    Wallet
} from 'lucide-react'
import clsx from 'clsx'

export function SiteHeader() {
    const { user, signOut } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

    const navigation = [
        { name: 'Trang chủ', href: '/' },
        { name: 'Khám phá', href: '/explore' },
        { name: 'Yêu cầu', href: '/requests' },
        { name: 'Bảng giá', href: '/dashboard/pricing' },
    ]

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <nav className="glass sticky top-0 z-50 border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 sm:h-20">
                    {/* Logo & Desktop Nav */}
                    <div className="flex items-center gap-12">
                        <Logo size="sm" />
                        <div className="hidden md:flex items-center gap-8">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={clsx(
                                        "text-sm font-bold transition-colors",
                                        pathname === item.href
                                            ? "text-primary-600"
                                            : "text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            // Logged In State
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex items-center gap-3 p-1 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-bold text-gray-900">{user.full_name}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">Member</p>
                                    </div>
                                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white shadow-md">
                                        <span className="font-black">{user.full_name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                </button>

                                {/* Profile Dropdown */}
                                {isProfileMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm font-bold text-gray-900">{user.full_name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>

                                            <div className="p-2 space-y-1">
                                                <Link
                                                    href="/dashboard/roi"
                                                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                >
                                                    <LayoutDashboard className="w-4 h-4 text-primary-600" />
                                                    Dashboard
                                                </Link>
                                                <Link
                                                    href="/dashboard/profile"
                                                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                >
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    Hồ sơ của tôi
                                                </Link>
                                                <Link
                                                    href="/dashboard/pricing"
                                                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                >
                                                    <Wallet className="w-4 h-4 text-gray-400" />
                                                    Gói dịch vụ / Billing
                                                </Link>
                                            </div>

                                            <div className="p-2 border-t border-gray-100 mt-1">
                                                <button
                                                    onClick={handleSignOut}
                                                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            // Not Logged In State
                            <div className="flex items-center gap-2 sm:gap-4">
                                <Link href="/login">
                                    <Button variant="ghost" className="hidden sm:block font-bold text-gray-600">Đăng nhập</Button>
                                </Link>
                                <Link href="/register">
                                    <Button variant="outline" className="font-bold text-gray-900 border-gray-200">Đăng ký</Button>
                                </Link>
                                <Link href="/requests/create">
                                    <Button className="premium-gradient border-none font-black shadow-xl shadow-primary-500/10 hover:scale-105 transition-transform px-4 sm:px-8 h-10 sm:h-12 text-sm sm:text-base">
                                        Nhận tư vấn & báo giá
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-gray-600"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-gray-100 py-4 animate-in slide-in-from-top duration-300">
                        <div className="space-y-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="block px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            {!user && (
                                <div className="pt-4 mt-2 border-t border-gray-100 px-4 space-y-3">
                                    <Link href="/login" className="block text-center w-full py-3 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl">
                                        Đăng nhập
                                    </Link>
                                    <Link href="/register" className="block text-center w-full py-3 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl">
                                        Đăng ký
                                    </Link>
                                    <Link href="/requests/create" className="block text-center w-full py-3 text-sm font-bold text-white premium-gradient rounded-xl shadow-lg shadow-primary-500/20">
                                        Nhận tư vấn & báo giá
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
