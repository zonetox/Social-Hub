'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { SmartSearch } from '@/components/dashboard/SmartSearch'
import {
    Home,
    User,
    Settings,
    Shield,
    LogOut,
    Menu,
    X,
    Search,
    Sparkles,
    DollarSign,
    Inbox,
    BarChart3,
    Users
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export function Navbar() {
    const { user, signOut, isAdmin } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsSearchOpen(true)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const mainNavigation = [
        { name: 'Hub', href: '/hub', icon: Home },
        { name: 'Contacts', href: '/contacts', icon: Users },
    ]

    const moreNavigation = [
        { name: 'My Cards', href: '/cards', icon: Inbox },
        { name: 'Pricing', href: '/pricing', icon: Sparkles },
    ]

    const accountNavigation = [
        { name: 'Profile', href: '/profile', icon: User },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/settings', icon: Settings },
    ]

    const adminNavigation = isAdmin ? [
        { name: 'Admin Panel', href: '/admin', icon: Shield },
        { name: 'Transactions', href: '/admin/payments', icon: DollarSign },
    ] : []

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    const NavLink = ({ item, mobile = false }: { item: any; mobile?: boolean }) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
            <Link
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    } ${mobile ? 'px-4 py-4 text-base' : ''}`}
            >
                <Icon className={`w-4 h-4 ${mobile ? 'w-5 h-5' : ''}`} />
                {item.name}
            </Link>
        )
    }

    return (
        <nav className="glass sticky top-0 z-40 border-t-0 border-x-0 rounded-none shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    {/* Logo & Main Nav */}
                    <div className="flex items-center gap-12">
                        <Logo size="sm" />

                        <div className="hidden md:flex items-center gap-1">
                            {mainNavigation.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Search & User Dropdown */}
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors group"
                            title="Tìm kiếm (Ctrl+K)"
                        >
                            <Search className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center p-1 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all bg-white shadow-sm"
                            >
                                <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                                    <span className="text-sm font-black">
                                        {user?.full_name?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                <div className="hidden sm:flex items-center gap-1 ml-3 mr-2">
                                    <span className="text-sm font-bold text-gray-700 max-w-[120px] truncate">
                                        {user?.full_name?.split(' ')[0]}
                                    </span>
                                    <Menu className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden">
                                        {/* User Info Header */}
                                        <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 -mt-3 mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm">
                                                    <User className="w-6 h-6 text-primary-600" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-black text-gray-900 truncate">{user?.full_name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'
                                                            }`}>
                                                            {isAdmin ? 'Administrator' : 'Professional'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-2 space-y-4">
                                            {/* App Section */}
                                            <div>
                                                <p className="px-3 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ứng dụng & Tool</p>
                                                <div className="space-y-0.5">
                                                    {moreNavigation.map(item => (
                                                        <Link
                                                            key={item.name}
                                                            href={item.href}
                                                            className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-primary-50 hover:text-primary-700 rounded-xl transition-colors"
                                                            onClick={() => setIsProfileMenuOpen(false)}
                                                        >
                                                            <item.icon className="w-4 h-4" />
                                                            {item.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Account Section */}
                                            <div>
                                                <p className="px-3 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cá nhân & Cài đặt</p>
                                                <div className="space-y-0.5">
                                                    {accountNavigation.map(item => (
                                                        <Link
                                                            key={item.name}
                                                            href={item.href}
                                                            className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors"
                                                            onClick={() => setIsProfileMenuOpen(false)}
                                                        >
                                                            <item.icon className="w-4 h-4" />
                                                            {item.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Admin Section */}
                                            {isAdmin && (
                                                <div className="pt-2 border-t border-gray-50">
                                                    <p className="px-3 py-1 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Quản trị hệ thống</p>
                                                    <div className="space-y-0.5">
                                                        {adminNavigation.map(item => (
                                                            <Link
                                                                key={item.name}
                                                                href={item.href}
                                                                className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                                                                onClick={() => setIsProfileMenuOpen(false)}
                                                            >
                                                                <item.icon className="w-4 h-4 text-amber-600" />
                                                                {item.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-100 mt-4 pt-2 px-2">
                                            <button
                                                onClick={handleSignOut}
                                                className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl w-full transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Đăng xuất hệ thống
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-xl hover:bg-gray-100"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100 animate-in slide-in-from-top duration-300">
                        <div className="space-y-1">
                            <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Truy cập nhanh</p>
                            {mainNavigation.map((item) => (
                                <NavLink key={item.name} item={item} mobile />
                            ))}
                            {moreNavigation.map((item) => (
                                <NavLink key={item.name} item={item} mobile />
                            ))}

                            <p className="mt-4 px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tài khoản</p>
                            {accountNavigation.map((item) => (
                                <NavLink key={item.name} item={item} mobile />
                            ))}

                            {isAdmin && (
                                <>
                                    <p className="mt-4 px-4 py-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">Quản trị viên</p>
                                    {adminNavigation.map((item) => (
                                        <NavLink key={item.name} item={item} mobile />
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Navigation - Visible only on small screens */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 py-3 z-50 flex justify-between items-center safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {[...mainNavigation, ...moreNavigation.slice(0, 1), { name: 'Me', href: '/profile', icon: User }].map((item: any) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary-600 scale-110' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'fill-primary-50' : ''}`} />
                            <span className="text-[9px] font-black uppercase tracking-tighter">{item.name}</span>
                        </Link>
                    )
                })}
            </div>

            <SmartSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </nav>
    )
}
