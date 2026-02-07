'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Search, ExternalLink, Zap, PlusCircle, ChevronDown, ChevronUp, Clock, Tag, Calendar, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import type { RecommendedRequest } from '@/actions/recommendations'
import { RecommendedRequests } from '@/components/dashboard/RecommendedRequests'

import { DashboardLoadingSkeleton, DashboardErrorState, DashboardEmptyState } from '@/components/dashboard/DashboardStates'

interface GroupedRequest {
    requestId: string
    requestTitle: string
    requestStatus: string
    requestCreatedAt?: string
    categoryName?: string
    offers: any[]
}

export default function MyOffersPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()

    const [groupedOffers, setGroupedOffers] = useState<GroupedRequest[]>([])
    const [recommendations, setRecommendations] = useState<RecommendedRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [quota, setQuota] = useState({ used: 0, limit: 0, credits: 0 })
    const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set())

    const toggleExpand = (requestId: string) => {
        setExpandedRequests(prev => {
            const next = new Set(prev)
            if (next.has(requestId)) {
                next.delete(requestId)
            } else {
                next.add(requestId)
            }
            return next
        })
    }

    const fetchData = async () => {
        if (!user) return

        setLoading(true)
        setError(null)
        try {
            // 1. Fetch Offers Summary
            const { data: myProfiles, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)

            if (profileError) throw profileError

            const myProfileIds = (myProfiles as any)?.map((p: any) => p.id) || []

            if (myProfileIds.length > 0) {
                const { data: offersData, error: summaryError } = await supabase
                    .from('my_offers_summary')
                    .select('*')
                    .in('profile_id', myProfileIds)
                    .order('offered_at', { ascending: false })

                if (summaryError) throw summaryError

                if (offersData && offersData.length > 0) {
                    // Enrich with Category & CreatedAt from service_requests
                    const requestIds = [...new Set(offersData.map((o: any) => o.request_id))]

                    let requestsMetadata: Record<string, any> = {}

                    if (requestIds.length > 0) {
                        const { data: reqData } = await supabase
                            .from('service_requests')
                            .select(`
                                id, 
                                created_at,
                                category:profile_categories(name)
                            `)
                            .in('id', requestIds)

                        if (reqData) {
                            requestsMetadata = reqData.reduce((acc: any, req: any) => {
                                acc[req.id] = req
                                return acc
                            }, {})
                        }
                    }

                    // Group by Request
                    const groups: Record<string, GroupedRequest> = {}

                    offersData.forEach((offer: any) => {
                        if (!groups[offer.request_id]) {
                            const meta = requestsMetadata[offer.request_id]
                            groups[offer.request_id] = {
                                requestId: offer.request_id,
                                requestTitle: offer.request_title,
                                requestStatus: offer.request_status,
                                requestCreatedAt: meta?.created_at,
                                categoryName: meta?.category?.name,
                                offers: []
                            }
                        }
                        groups[offer.request_id].offers.push(offer)
                    })

                    setGroupedOffers(Object.values(groups))
                    // Auto expand first one
                    if (Object.keys(groups).length > 0) {
                        setExpandedRequests(new Set([Object.keys(groups)[0]]))
                    }
                } else {
                    setGroupedOffers([])
                }
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

            // Get limit - Use maybeSingle to prevent crash if no sub found
            const { data: sub } = await supabase
                .from('user_subscriptions')
                .select(`*, plan:subscription_plans(features)`)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .gte('expires_at', new Date().toISOString())
                .maybeSingle()

            const subscription = sub as any
            let limitCount = 0
            if (subscription?.plan?.features) {
                limitCount = subscription.plan.features.offer_quota_per_month || 0
            }

            // Get Credits - Use maybeSingle to prevent crash if no credits row
            const { data: creditData } = await supabase
                .from('card_credits')
                .select('amount')
                .eq('user_id', user.id)
                .maybeSingle()

            const credits = (creditData as any)?.amount || 0

            setQuota({ used: usedCount, limit: limitCount, credits })

            // 3. Fetch Recommendations
            try {
                const recsRes = await fetch('/api/recommendations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ limit: 5 })
                })
                if (recsRes.ok) {
                    const recs = await recsRes.json()
                    setRecommendations(recs)
                }
            } catch (err) {
                console.warn('Failed to load recommendations', err)
            }

        } catch (err: any) {
            console.error('[MyOffersPage] Error fetching data:', err)
            setError(err.message || 'Không thể tải dữ liệu báo giá.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [user])

    if (loading) return <DashboardLoadingSkeleton />

    if (error) return <DashboardErrorState message={error} onRetry={fetchData} />

    const usagePercent = quota.limit > 0 ? Math.min((quota.used / quota.limit) * 100, 100) : 100

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-gray-900">Báo giá của tôi</h1>
                <p className="text-gray-500">Theo dõi trạng thái các báo giá đã gửi</p>
            </div>

            {/* Upsell Banner if Quota Exceeded or Near Limit */}
            {(quota.limit > 0 && quota.used >= quota.limit) && (
                <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-amber-600 fill-current" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Bạn đã dùng hết lượt báo giá tháng này</h3>
                            <p className="text-gray-600 text-sm mt-1">
                                Nâng cấp gói Membership để mở khóa không giới hạn lượt báo giá và tiếp cận nhiều khách hàng hơn.
                            </p>
                        </div>
                    </div>
                    <Link href="/dashboard/pricing">
                        <Button className="premium-gradient border-none shadow-lg whitespace-nowrap">
                            Nâng cấp ngay
                        </Button>
                    </Link>
                </div>
            )}

            {groupedOffers.length === 0 ? (
                <div className="space-y-8 animate-in fade-in duration-700">
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <LayoutGrid className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Bạn chưa gửi báo giá nào</h3>
                        <p className="text-gray-500 mb-10 max-w-md mx-auto font-medium">
                            Hãy chủ động tìm kiếm các yêu cầu dịch vụ phù hợp để bắt đầu hành trình chinh phục khách hàng.
                        </p>
                        <Link href="/requests">
                            <Button size="lg" className="premium-gradient shadow-xl shadow-primary-500/20 px-10 rounded-2xl font-black">
                                Khám phá cơ hội ngay
                            </Button>
                        </Link>
                    </div>
                    {recommendations.length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                            <RecommendedRequests requests={recommendations} />
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* List Grouped Requests */}
                    {groupedOffers.map((group, idx) => {
                        const isExpanded = expandedRequests.has(group.requestId)
                        const isClosed = group.requestStatus === 'closed'

                        return (
                            <div
                                key={group.requestId}
                                className={clsx(
                                    "bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden",
                                    isExpanded ? "shadow-2xl border-primary-100 ring-4 ring-primary-50/50" : "border-gray-100 shadow-sm hover:shadow-lg",
                                    isClosed && !isExpanded && "opacity-80 grayscale-[0.3]"
                                )}
                            >
                                {/* Header - The Request Context */}
                                <div
                                    className={clsx(
                                        "p-6 cursor-pointer flex flex-col lg:flex-row gap-6 lg:items-center justify-between transition-colors relative",
                                        isExpanded ? "bg-primary-50/30" : "bg-white hover:bg-gray-50/50"
                                    )}
                                    onClick={() => toggleExpand(group.requestId)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            {isClosed ? (
                                                <Badge variant="default" className="bg-gray-100 text-gray-500 border-gray-200 font-black px-3">
                                                    ĐÃ ĐÓNG
                                                </Badge>
                                            ) : (
                                                <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black px-3">
                                                    ĐANG MỞ
                                                </Badge>
                                            )}
                                            {group.categoryName && (
                                                <Badge variant="default" className="text-[11px] text-primary-600 border-primary-100 bg-primary-50 px-3 font-black uppercase tracking-wider">
                                                    {group.categoryName}
                                                </Badge>
                                            )}
                                            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 ml-1">
                                                <Calendar className="w-3 h-3" />
                                                Đăng {group.requestCreatedAt && formatDistanceToNow(new Date(group.requestCreatedAt), { addSuffix: true, locale: vi })}
                                            </span>
                                        </div>

                                        <h3 className={clsx(
                                            "text-xl font-black mb-2 leading-tight transition-colors truncate",
                                            isExpanded ? "text-primary-700" : "text-gray-900"
                                        )}>
                                            {group.requestTitle}
                                        </h3>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-[11px] font-black text-gray-600">
                                                <Zap className="w-3 h-3 fill-current" />
                                                {group.offers.length} BÁO GIÁ CỦA BẠN
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <Link href={`/requests/${group.requestId}`} onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-10 px-5 rounded-xl border-gray-200 font-black text-gray-600 hover:text-primary-600 hover:border-primary-200 transition-all flex items-center gap-2"
                                            >
                                                Xem yêu cầu
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Button>
                                        </Link>
                                        <div className={clsx(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                            isExpanded ? "bg-primary-600 text-white rotate-180" : "bg-gray-50 text-gray-400"
                                        )}>
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Body - Offers Sub-list */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50/30 p-4 lg:p-8 space-y-4 animate-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-px bg-gray-200 flex-grow"></div>
                                            <span className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">Chi tiết các báo giá</span>
                                            <div className="h-px bg-gray-200 flex-grow"></div>
                                        </div>

                                        {group.offers.map(offer => (
                                            <div key={offer.id} className="bg-white p-5 rounded-2xl border border-gray-200/60 shadow-sm hover:border-primary-100 transition-all group/offer">
                                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                                    <div className="flex gap-4">
                                                        <div className={clsx(
                                                            "w-1.5 h-auto rounded-full shrink-0",
                                                            offer.status === 'accepted' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                                                                offer.status === 'rejected' ? "bg-red-400" : "bg-amber-400"
                                                        )}></div>
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                                <span className="text-xl font-black text-gray-900">
                                                                    {offer.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(offer.price) : 'Thỏa thuận'}
                                                                </span>
                                                                <Badge className={clsx(
                                                                    "text-[10px] font-black px-2.5 py-1 rounded-lg border-none",
                                                                    offer.status === 'accepted' ? "bg-emerald-500 text-white" :
                                                                        offer.status === 'rejected' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                                                                )}>
                                                                    {offer.status === 'accepted' ? 'ĐƯỢC CHỌN' :
                                                                        offer.status === 'rejected' ? 'KHÔNG PHÙ HỢP' : 'ĐANG CHỜ DUYỆT'}
                                                                </Badge>
                                                                <span className="text-[11px] font-bold text-gray-400">
                                                                    • {formatDistanceToNow(new Date(offer.offered_at), { addSuffix: true, locale: vi })}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 group-hover/offer:bg-white transition-colors italic">
                                                                &quot;{offer.message}&quot;
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* In-row action if needed, or just status indicator */}
                                                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-0 pl-5 md:pl-0">
                                                        {offer.status === 'accepted' && (
                                                            <div className="flex items-center gap-2 text-emerald-600 text-xs font-black">
                                                                <PlusCircle className="w-4 h-4" />
                                                                KẾT NỐI NGAY
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

        </div>
    )
}
