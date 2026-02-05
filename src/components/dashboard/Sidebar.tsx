'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/shared/Logo'
import {
    LayoutDashboard,
    Briefcase,
    MessageSquare,
    BarChart3,
    Compass,
    Users,
    CreditCard,
    Sparkles,
    Coins,
    User,
    Settings,
    X
} from 'lucide-react'
import clsx from 'clsx'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Cơ hội', href: '/dashboard/requests', icon: Briefcase },
        { name: 'Báo giá', href: '/dashboard/offers', icon: MessageSquare },
        { name: 'Hiệu quả', href: '/dashboard/roi', icon: BarChart3 },
        { type: 'divider', label: 'Khám phá' },
        { name: 'Khám phá', href: '/explore', icon: Compass },
        { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
        { name: 'My Cards', href: '/dashboard/cards', icon: CreditCard },
        { type: 'divider', label: 'Tài khoản' },
        { name: 'Gói dịch vụ', href: '/dashboard/pricing', icon: Sparkles },
        { name: 'Mua Credits', href: '/credits/buy', icon: Coins },
        { name: 'Hồ sơ', href: '/dashboard/profile', icon: User },
        { name: 'Cài đặt', href: '/dashboard/settings', icon: Settings },
    ]

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl lg:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Section */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-gray-50 bg-white sticky top-0 z-10">
                    <Logo size="sm" />
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 lg:hidden"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    {navigation.map((item, idx) => {
                        if (item.type === 'divider') {
                            return (
                                <div key={`divider-${idx}`} className="pt-6 pb-2 px-4">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                </div>
                            )
                        }

                        const Icon = item.icon!
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.name}
                                href={item.href!}
                                onClick={() => {
                                    if (window.innerWidth < 1024) onClose()
                                }}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all group",
                                    isActive
                                        ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <Icon className={clsx(
                                    "w-5 h-5 transition-transform group-hover:scale-110",
                                    isActive ? "text-white" : "text-gray-400 group-hover:text-primary-500"
                                )} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Sidebar Footer/Support */}
                <div className="p-4 border-t border-gray-50">
                    <div className="bg-primary-50 rounded-2xl p-4">
                        <p className="text-xs font-black text-primary-700 uppercase tracking-wider mb-2">Cần hỗ trợ?</p>
                        <p className="text-[11px] text-primary-600 font-bold leading-relaxed mb-3">
                            Kết nối với đội ngũ để được giải đáp thắc mắc 24/7.
                        </p>
                        <button className="w-full py-2 bg-white rounded-xl text-[11px] font-black text-primary-600 shadow-sm hover:shadow-md transition-shadow">
                            Trung tâm trợ giúp
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
