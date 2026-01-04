'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import {
    Home,
    User,
    Settings,
    Shield,
    LogOut,
    Menu,
    X,
    Search,
    Sparkles
} from 'lucide-react'

export function Navbar() {
    const { user, signOut, isAdmin } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

    const navigation = [
        { name: 'Hub', href: '/hub', icon: Home },
        { name: 'My Profile', href: '/profile', icon: User },
        { name: 'Settings', href: '/settings', icon: Settings },
        { name: 'Upgrade', href: '/upgrade', icon: Sparkles },
    ]

    if (isAdmin) {
        navigation.push({ name: 'Admin', href: '/admin', icon: Shield })
    }

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/hub" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                                <span className="text-xl font-bold text-white">S</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900 hidden sm:block">
                                Social Hub
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block">
                            <Search className="w-5 h-5 text-gray-600" />
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">
                                        {user?.full_name?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-gray-700 hidden md:block">
                                    {user?.full_name}
                                </span>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                        <div className="px-4 py-3 border-b border-gray-200">
                                            <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                        </div>

                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <User className="w-4 h-4" />
                                            My Profile
                                        </Link>

                                        <Link
                                            href="/settings"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </Link>

                                        {isAdmin && (
                                            <Link
                                                href="/admin"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                            >
                                                <Shield className="w-4 h-4" />
                                                Admin Panel
                                            </Link>
                                        )}

                                        <div className="border-t border-gray-200 mt-1 pt-1">
                                            <button
                                                onClick={handleSignOut}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </nav>
    )
}
