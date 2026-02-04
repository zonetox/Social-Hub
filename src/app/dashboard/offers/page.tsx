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

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return

            // 1. Fetch Offers Summary
            const { data: myProfiles } = await supabase.from('profiles').select('id').eq('user_id', user.id)
            const myProfileIds = (myProfiles as any)?.map((p: any) => p.id) || []

            if (myProfileIds.length > 0) {
                const { data: offersData, error } = await supabase
                    .from('my_offers_summary')
                    .select('*')
                    .in('profile_id', myProfileIds)
                    .order('offered_at', { ascending: false })

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

            // Get limit
            const { data: sub } = await supabase
                .from('user_subscriptions')
                .select(`*, plan:subscription_plans(features)`)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .gte('expires_at', new Date().toISOString())
                .single()

            const subscription = sub as any
            let limitCount = 0
            if (subscription?.plan?.features) {
                limitCount = subscription.plan.features.offer_quota_per_month || 0
            }

            // Get Credits
            const { data: creditData } = await supabase
                .from('card_credits')
                .select('amount')
                .eq('user_id', user.id)
                .single()

            const credits = (creditData as any)?.amount || 0

            // 3. Fetch Recommendations
            try {
                const recsRes = await fetch('/api/recommendations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ limit: 5 })
                })
                const recs = await recsRes.json()
                setRecommendations(recs)
            } catch (err) {
                console.error('Failed to load recommendations', err)
            }

            setQuota({ used: usedCount, limit: limitCount, credits })
            setLoading(false)
        }

        fetchData()
    }, [user])

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>

    const usagePercent = quota.limit > 0 ? Math.min((quota.used / quota.limit) * 100, 100) : 100

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Báo giá của bạn</h1>
                    <p className="text-gray-500">Theo dõi trạng thái các báo giá đã gửi</p>
                </div>

                {/* Quota Widget - Compact */}
                <div className="bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6 w-full md:w-auto">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500 fill-current" />
                            Quota tháng
                        </span>
                        <div className="flex items-end gap-2">
                            <span className="text-lg font-black text-gray-900 leading-none">{quota.used}/{quota.limit}</span>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block"></div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                            <PlusCircle className="w-3 h-3 text-green-500" />
                            Credit
                        </span>
                        <span className="text-lg font-black text-gray-900 leading-none">{quota.credits}</span>
                    </div>
                    <Button
                        size="sm" variant="ghost"
                        className="ml-auto text-primary-600 hover:bg-primary-50 h-8"
                        onClick={() => router.push('/pricing')}
                    >
                        Mua thêm
                    </Button>
                </div>
            </div>

            {groupedOffers.length === 0 ? (
                <div className="space-y-8">
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LayoutGrid className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Bạn chưa gửi báo giá nào</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Hãy tìm kiếm các yêu cầu phù hợp với kỹ năng của bạn và bắt đầu chào giá ngay.
                        </p>
                        <Link href="/requests">
                            <Button size="lg" className="premium-gradient shadow-lg shadow-primary-500/20">
                                Tìm kiếm yêu cầu việc làm
                            </Button>
                        </Link>
                    </div>
                    {recommendations.length > 0 && (
                        <RecommendedRequests requests={recommendations} />
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* List Grouped Requests */}
                    {groupedOffers.map(group => {
                        const isExpanded = expandedRequests.has(group.requestId)

                        return (
                            <div key={group.requestId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                {/* Header */}
                                <div
                                    className="p-5 cursor-pointer flex flex-col md:flex-row gap-4 md:items-center justify-between bg-white hover:bg-gray-50/50 transition-colors"
                                    onClick={() => toggleExpand(group.requestId)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge variant={group.requestStatus === 'open' ? 'success' : 'default'} className="uppercase text-[10px] tracking-wider px-2 py-0.5">
                                                {group.requestStatus === 'open' ? 'Đang mở' : 'Đã đóng'}
                                            </Badge>
                                            {group.categoryName && (
                                                <Badge variant="default" className="text-[10px] text-gray-500 border border-gray-200 bg-transparent font-normal">
                                                    {group.categoryName}
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight group-hover:text-primary-600 transition-colors">
                                            {group.requestTitle}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                            <span className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                                {group.offers.length} Báo giá của bạn
                                            </span>
                                            {group.requestCreatedAt && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(group.requestCreatedAt), { addSuffix: true, locale: vi })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end md:self-center">
                                        <Link href={`/requests/${group.requestId}`} onClick={(e) => e.stopPropagation()}>
                                            <Button size="sm" variant={group.requestStatus === 'open' ? 'primary' : 'outline'} className="h-9">
                                                {group.requestStatus === 'open' ? 'Xem yêu cầu' : 'Xem lịch sử'}
                                            </Button>
                                        </Link>
                                        <div className={clsx("p-2 rounded-full bg-gray-50 text-gray-500 transition-transform", isExpanded && "rotate-180")}>
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Body - Offers List */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50/30 p-4 sm:p-5 space-y-3 animation-slide-down">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase px-1">Lịch sử báo giá của bạn</h4>
                                        {group.offers.map(offer => (
                                            <div key={offer.id} className="bg-white p-4 rounded-xl border border-gray-200/60 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                                <div className="flex items-center gap-4">
                                                    <div className={clsx(
                                                        "w-1 h-10 rounded-full",
                                                        offer.status === 'accepted' ? "bg-green-500" :
                                                            offer.status === 'rejected' ? "bg-red-500" : "bg-amber-400"
                                                    )}></div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-mono font-bold text-gray-900">
                                                                {offer.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(offer.price) : 'Thương lượng'}
                                                            </span>
                                                            <span className={clsx(
                                                                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                                                offer.status === 'accepted' ? "bg-green-50 text-green-700 border-green-100" :
                                                                    offer.status === 'rejected' ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                                            )}>
                                                                {offer.status === 'accepted' ? 'Được chọn' :
                                                                    offer.status === 'rejected' ? 'Khách không chọn' : 'Đang chờ duyệt'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 line-clamp-1 max-w-md">{offer.message}</p>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-400 font-medium pl-5 sm:pl-0">
                                                    Đã gửi {formatDistanceToNow(new Date(offer.offered_at), { addSuffix: true, locale: vi })}
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
