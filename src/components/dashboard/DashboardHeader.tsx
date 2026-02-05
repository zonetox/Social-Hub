'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Menu, Search, LogOut, User, Bell } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SmartSearch } from './SmartSearch'

interface DashboardHeaderProps {
    onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
    const { user, signOut } = useAuth()
    const router = useRouter()
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 transition-all">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-gray-500 hover:bg-gray-50 rounded-xl lg:hidden"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="hidden lg:flex items-center gap-2 text-sm text-gray-400 font-bold">
                    <span>Chào mừng trở lại,</span>
                    <span className="text-gray-900 font-black">{user?.full_name?.split(' ')[0]} 👋</span>
                </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
                {/* Search Trigger */}
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all group"
                    title="Tìm kiếm (Ctrl+K)"
                >
                    <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>

                {/* Notifications */}
                <button
                    className="p-3 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all relative"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>

                <div className="h-8 w-px bg-gray-100 mx-1 hidden lg:block" />

                {/* User Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 p-1 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/10">
                            <span className="text-sm font-black">{user?.full_name?.charAt(0) || 'U'}</span>
                        </div>
                    </button>

                    {isProfileOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                            <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden">
                                <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 -mt-3 mb-2">
                                    <p className="text-sm font-black text-gray-900 truncate">{user?.full_name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold truncate mt-0.5">{user?.email}</p>
                                </div>
                                <div className="p-2 space-y-1">
                                    <button
                                        onClick={() => {
                                            router.push('/dashboard/profile')
                                            setIsProfileOpen(false)
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-black text-gray-600 hover:bg-gray-50 rounded-2xl transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        Hồ sơ cá nhân
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-black text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <SmartSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </header>
    )
}
