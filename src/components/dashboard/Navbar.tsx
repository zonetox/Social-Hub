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

    const appNavigation = [
        { name: 'Hub', href: '/hub', icon: Home },
        { name: 'Contacts', href: '/contacts', icon: Users },
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
        const isAdminLink = item.href.startsWith('/admin')

        return (
            <Link
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : isAdminLink
                        ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    } ${mobile ? 'px-4 py-4 text-base' : ''}`}
            >
                <Icon className={`w-4 h-4 ${isAdminLink && !isActive ? 'text-amber-600' : ''} ${mobile ? 'w-5 h-5' : ''}`} />
                {item.name}
            </Link>
        )
    }

    return (
        <nav className="glass sticky top-0 z-40 border-t-0 border-x-0 rounded-none shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    {/* Logo & App Nav */}
                    <div className="flex items-center gap-8">
                        <Logo size="sm" />

                        <div className="hidden lg:flex items-center gap-1 border-l border-gray-200 pl-8">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 absolute -top-4">Application</span>
                            {appNavigation.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Account, Admin, User Dropdown */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Account Nav - Desktop */}
                        <div className="hidden xl:flex items-center gap-1 border-r border-gray-200 pr-4 mr-2">
                            {accountNavigation.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}
                        </div>

                        {/* Admin Action Area */}
                        {isAdmin && (
                            <div className="hidden md:flex items-center gap-1 bg-amber-50/50 p-1 rounded-xl border border-amber-100 mr-2">
                                {adminNavigation.map((item) => (
                                    <NavLink key={item.name} item={item} />
                                ))}
                            </div>
                        )}

                        {/* Search */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors hidden sm:block group"
                            title="Tìm kiếm (Ctrl+K)"
                        >
                            <Search className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center gap-3 p-1.5 pr-3 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all bg-white"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <span className="text-sm font-black text-white">
                                        {user?.full_name?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                <div className="hidden md:flex flex-col items-start leading-tight">
                                    <span className="text-xs font-bold text-gray-900 line-clamp-1">
                                        {user?.full_name}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'
                                            }`}>
                                            {isAdmin ? 'Administrator' : 'Professional'}
                                        </span>
                                    </div>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                                        <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                                                    <User className="w-5 h-5 text-primary-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900">{user?.full_name}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">{user?.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-2 space-y-0.5">
                                            {[...appNavigation, ...accountNavigation].map(item => (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-primary-600 rounded-xl transition-colors"
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                >
                                                    <item.icon className="w-4 h-4" />
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </div>

                                        {isAdmin && (
                                            <div className="mt-2 pt-2 border-t border-gray-50 px-2 space-y-0.5">
                                                <p className="px-3 py-1 text-[9px] font-black text-amber-600 uppercase tracking-widest">Admin Control</p>
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
                                        )}

                                        <div className="border-t border-gray-50 mt-2 pt-1 px-2">
                                            <button
                                                onClick={handleSignOut}
                                                className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl w-full transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Kết thúc phiên làm việc
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-xl hover:bg-gray-100"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {isMenuOpen && (
                    <div className="lg:hidden py-4 border-t border-gray-100 animate-in slide-in-from-top duration-300">
                        <div className="space-y-1">
                            <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ứng dụng</p>
                            {appNavigation.map((item) => (
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
                {[...appNavigation.slice(0, 3), ...accountNavigation.slice(0, 1), { name: 'Admin', href: '/admin', icon: Shield, hidden: !isAdmin }].map((item: any) => {
                    if (item.hidden) return null
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
