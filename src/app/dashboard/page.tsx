'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useProfile } from '@/lib/hooks/useProfile'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DashboardLoadingSkeleton, DashboardErrorState } from '@/components/dashboard/DashboardStates'
import {
    TrendingUp,
    Send,
    CheckCircle,
    Zap,
    AlertTriangle,
    ChevronRight,
    ArrowUpRight,
    Search,
    CreditCard
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

export default function DashboardOverviewPage() {
    const { user } = useAuth()
    const { profile, loading: profileLoading, error: profileError } = useProfile(user?.id)
    const { subscription, loading: subLoading, error: subError } = useSubscription()

    const [metrics, setMetrics] = useState({ opportunities: 0, offersSent: 0, requestsClosed: 0 })
    const [metricsLoading, setMetricsLoading] = useState(true)

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!user) return
            try {
                setMetricsLoading(true)
                const response = await fetch('/api/analytics/roi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timeRange: 'month' })
                })

                // FIX-04: Handle Auth Errors (Safe Reload)
                if (response.status === 401) {
                    console.warn('[Dashboard] Unauthorized - attempting safe refresh')
                    const hasReloaded = localStorage.getItem('dashboard_reload_401')

                    if (!hasReloaded) {
                        localStorage.setItem('dashboard_reload_401', '1')
                        window.location.reload()
                        return
                    } else {
                        localStorage.removeItem('dashboard_reload_401')
                        window.location.href = '/login' // Direct navigation to login
                        return
                    }
                }

                // FIX-05: Safe JSON Parsing
                if (!response.ok) {
                    const text = await response.text()
                    throw new Error(`API Error ${response.status}: ${text.slice(0, 100)}`)
                }

                // Success - clear any previous reload flag
                localStorage.removeItem('dashboard_reload_401')

                const data = await response.json()
                setMetrics(data)
            } catch (error) {
                console.error('Failed to fetch metrics:', error)
                // Optional: set safe defaults or show error toast
            } finally {
                setMetricsLoading(false)
            }
        }
        fetchMetrics()
    }, [user])

    if (profileLoading || subLoading || metricsLoading) {
        return <DashboardLoadingSkeleton />
    }

    if (profileError || subError) {
        return <DashboardErrorState message={profileError || subError || 'Lỗi tải dữ liệu Dashboard'} onRetry={() => window.location.reload()} />
    }

    const stats = [
        {
            label: 'Cơ hội trong ngành',
            value: metrics.opportunities,
            icon: Search,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            href: '/dashboard/requests',
            cta: 'Xem cơ hội'
        },
        {
            label: 'Báo giá đã gửi',
            value: metrics.offersSent,
            icon: Send,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            href: '/dashboard/offers',
            cta: 'Quản lý báo giá'
        },
        {
            label: 'Hiệu quả (ROI)',
            value: metrics.requestsClosed,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50',
            href: '/dashboard/roi',
            cta: 'Xem báo cáo'
        }
    ]

    const features = (subscription?.plan?.features as any) || {}
    const requestQuota = features.request_quota_per_month || 0
    const offerQuota = features.offer_quota_per_month || 0

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Chào quay trở lại, <span className="text-primary-600">{profile?.display_name || user?.email}</span>!
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Đây là cái nhìn tổng quan về hoạt động kinh doanh của bạn tháng này.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href={`/${profile?.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="rounded-xl border-gray-200 font-bold hover:bg-gray-50">
                            Xem profile công khai
                            <ArrowUpRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Warning Banner */}
            {!profile?.category_id && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-bounce-subtle">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-900">Thiếu thông tin ngành nghề</p>
                            <p className="text-sm text-amber-700">Bạn cần chọn ngành nghề để nhận được thông báo về các cơ hội kinh doanh mới phù hợp.</p>
                        </div>
                    </div>
                    <Link href="/dashboard/profile">
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none font-bold rounded-xl whitespace-nowrap">
                            Cập nhật ngay
                        </Button>
                    </Link>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="group p-6 border border-gray-100 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={clsx("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-500", stat.bg)}>
                                <stat.icon className={clsx("w-6 h-6", stat.color)} />
                            </div>
                            <span className={clsx("text-4xl font-black tracking-tighter", stat.color)}>
                                {stat.value}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{stat.label}</h3>
                        <p className="text-xs text-gray-500 font-medium mb-6">Dữ liệu được cập nhật theo thời gian thực</p>

                        <Link href={stat.href}>
                            <Button variant="ghost" className="w-full text-primary-600 font-black flex items-center justify-between group/btn px-0 hover:bg-transparent">
                                {stat.cta}
                                <div className="p-1.5 bg-primary-50 rounded-lg group-hover/btn:bg-primary-600 group-hover/btn:text-white transition-colors">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </Button>
                        </Link>
                    </Card>
                ))}
            </div>

            {/* Quota & Upsell Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500 rounded-full blur-[120px] opacity-20 -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500 rounded-full blur-[100px] opacity-10 -ml-20 -mb-20" />

                    <div className="relative z-10 space-y-8">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 w-fit">
                                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-100">
                                        {subscription?.plan?.name || 'Gói miễn phí'}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black">Tình trạng giới hạn gói</h2>
                            </div>
                            <div className="flex gap-3">
                                <Link href="/dashboard/pricing">
                                    <Button className="bg-white text-gray-900 border-none font-black px-6 rounded-xl hover:scale-105 transition-transform">
                                        Nâng cấp VIP
                                    </Button>
                                </Link>
                                <Link href="/credits/buy">
                                    <Button variant="outline" className="border-white/20 text-white font-black px-6 rounded-xl hover:bg-white/10">
                                        Mua thêm lượt
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {/* Requests Quota */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-gray-400">Lượt gửi yêu cầu</span>
                                    <span className="text-lg font-black">
                                        {metrics.opportunities} <span className="text-sm font-medium text-gray-500">/ {requestQuota || '∞'}</span>
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-500 rounded-full shadow-[0_0_10px_rgba(var(--primary-500),0.5)]"
                                        style={{ width: requestQuota ? `${Math.min((metrics.opportunities / requestQuota) * 100, 100)}%` : '0%' }}
                                    />
                                </div>
                            </div>

                            {/* Offers Quota */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-gray-400">Lượt gửi báo giá</span>
                                    <span className="text-lg font-black">
                                        {metrics.offersSent} <span className="text-sm font-medium text-gray-500">/ {offerQuota || '∞'}</span>
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-secondary-500 rounded-full shadow-[0_0_10px_rgba(var(--secondary-500),0.5)]"
                                        style={{ width: offerQuota ? `${Math.min((metrics.offersSent / offerQuota) * 100, 100)}%` : '0%' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 font-medium italic">
                            Giới hạn của bạn sẽ được làm mới vào ngày đầu tiên của tháng tới.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center shadow-inner">
                        <CreditCard className="w-8 h-8 text-primary-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Nạp tín dụng</h3>
                        <p className="text-sm text-gray-500 font-medium px-4">
                            Sử dụng tín dụng để thực hiện báo giá khi hết lượt trong tháng.
                        </p>
                    </div>
                    <Link href="/credits/buy" className="w-full">
                        <Button variant="outline" className="w-full border-primary-100 text-primary-600 font-black rounded-xl hover:bg-primary-50">
                            Nạp ngay
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
