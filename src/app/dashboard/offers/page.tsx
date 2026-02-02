'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Search, ExternalLink, Zap, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'

export default function MyOffersPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()

    const [offers, setOffers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [quota, setQuota] = useState({ used: 0, limit: 0, credits: 0 })

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return

            // 1. Fetch Offers Summary
            const { data: myProfiles } = await supabase.from('profiles').select('id').eq('user_id', user.id)
            const myProfileIds = myProfiles?.map(p => p.id) || []

            if (myProfileIds.length > 0) {
                const { data, error } = await supabase
                    .from('my_offers_summary')
                    .select('*')
                    .in('profile_id', myProfileIds)
                    .order('offered_at', { ascending: false })

                if (data) setOffers(data)
            }

            // 2. Calculate Quota & Credits
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

            // Count offers
            let usedCount = 0
            if (myProfileIds.length > 0) {
                const { count } = await supabase
                    .from('service_offers')
                    .select('*', { count: 'exact', head: true })
                    .in('profile_id', myProfileIds)
                    .gte('created_at', startOfMonth)
                usedCount = count || 0
            }

            // Get limit
            const { data: sub } = await supabase
                .from('user_subscriptions')
                .select(`*, plan:subscription_plans(features)`)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .gte('expires_at', new Date().toISOString())
                .single()

            let limitCount = 0
            if (sub?.plan?.features) {
                limitCount = (sub.plan.features as any).offer_quota_per_month || 0
            }

            // Get Credits
            const { data: creditData } = await supabase
                .from('card_credits')
                .select('amount')
                .eq('user_id', user.id)
                .single()

            const credits = creditData?.amount || 0

            setQuota({ used: usedCount, limit: limitCount, credits })
            setLoading(false)
        }

        fetchData()
    }, [user])

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>

    const usagePercent = quota.limit > 0 ? Math.min((quota.used / quota.limit) * 100, 100) : 100

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Báo Giá Đã Gửi</h1>
                    <p className="text-gray-500">Quản lý các báo giá bạn đã gửi cho khách hàng</p>
                </div>

                {/* Quota Widget */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-full md:w-96 space-y-3">
                    {/* Main Quota */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-500 fill-current" />
                                Quota tháng này
                            </span>
                            <span className="text-xs font-bold text-gray-900">
                                {quota.used} / {quota.limit}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                                className={clsx(
                                    "h-full rounded-full transition-all duration-500",
                                    usagePercent > 90 ? "bg-red-500" : "premium-gradient"
                                )}
                                style={{ width: `${usagePercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Credits Row */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
                            <PlusCircle className="w-3 h-3 text-green-500" />
                            Credit mua thêm
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-gray-900">{quota.credits}</span>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-2 border-primary-100 text-primary-600 hover:bg-primary-50"
                                onClick={() => router.push('/pricing')}
                            >
                                Mua thêm
                            </Button>
                        </div>
                    </div>

                    {/* Upgrade Warning */}
                    {usagePercent >= 100 && quota.credits === 0 && (
                        <div className="pt-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="w-full text-xs text-red-500 bg-red-50 hover:bg-red-100 h-8"
                                onClick={() => router.push('/pricing')}
                            >
                                Hết lượt! Nâng cấp ngay
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {offers.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 mb-4">Bạn chưa gửi báo giá nào trong tháng này.</p>
                    <Link href="/requests">
                        <Button>Tìm kiếm yêu cầu ngay</Button>
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Yêu cầu</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Trạng thái Yêu Cầu</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Giá chào</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Lời nhắn</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Ngày gửi</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {offers.map(offer => (
                                    <tr key={offer.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <Link href={`/requests/${offer.request_id}`} className="font-bold text-gray-900 hover:text-primary-600 block max-w-xs truncate">
                                                {offer.request_title}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={offer.request_status === 'open' ? 'success' : 'secondary'} className="capitalize bg-gray-100 text-gray-600 border-none">
                                                {offer.request_status === 'open' ? 'Đang mở' : 'Đã đóng'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-700">
                                            {offer.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(offer.price) : 'Thương lượng'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {offer.message}
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                                            {formatDistanceToNow(new Date(offer.offered_at), { addSuffix: true, locale: vi })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/requests/${offer.request_id}`}>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-primary-600">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
