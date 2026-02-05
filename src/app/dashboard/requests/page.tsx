'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CheckCircle, Clock, Briefcase, ChevronRight, AlertCircle, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

export default function OpportunitiesPage() {
    const { user } = useAuth()
    const supabase = createClient()

    const [opportunities, setOpportunities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [myCategories, setMyCategories] = useState<string[]>([])
    const [myOfferRequestIds, setMyOfferRequestIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchOpportunities = async () => {
            if (!user) return

            setLoading(true)
            try {
                // 1. Get My Business Categories
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('category_id, category:profile_categories(name, slug)')
                    .eq('user_id', user.id)

                const categoryIds = profiles?.map((p: any) => p.category_id).filter(Boolean) || []
                const categoryNames = profiles?.map((p: any) => p.category?.name).filter(Boolean) || []
                setMyCategories(categoryNames)

                if (categoryIds.length === 0) {
                    setLoading(false)
                    return
                }

                // 2. Get Open Requests in these categories
                // Note: RLS policies on service_requests usually allow reading 'open' requests
                const { data: requests, error } = await supabase
                    .from('service_requests')
                    .select(`
                        id,
                        title,
                        status,
                        created_at,
                        budget,
                        category_id,
                        category:profile_categories(name, slug)
                    `)
                    .in('category_id', categoryIds)
                    .eq('status', 'open')
                    .order('created_at', { ascending: false })

                if (error) throw error

                // 3. Check which ones I already offered
                const { data: myOffers } = await supabase
                    .from('service_offers')
                    .select('request_id')
                    .eq('user_id', user.id)

                const offeredIds = new Set(myOffers?.map((o: any) => o.request_id))
                setMyOfferRequestIds(offeredIds)

                setOpportunities(requests || [])

            } catch (err) {
                console.error('Error fetching opportunities:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchOpportunities()
    }, [user])

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-gray-900 mb-2">Cơ hội trong ngành</h1>
                <p className="text-gray-500">
                    Danh sách các yêu cầu phù hợp với chuyên môn của bạn: <span className="font-bold text-primary-600">{myCategories.join(', ')}</span>
                </p>
            </div>

            {myCategories.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa cập nhật hồ sơ chuyên môn</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Vui lòng cập nhật danh mục ngành nghề trong hồ sơ của bạn để chúng tôi gợi ý các cơ hội phù hợp.
                    </p>
                    <Link href="/dashboard/profile">
                        <Button className="premium-gradient">Cập nhật hồ sơ ngay</Button>
                    </Link>
                </div>
            ) : opportunities.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LayoutGrid className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có cơ hội mới</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Hiện chưa có yêu cầu nào mới trong lĩnh vực của bạn. Vui lòng quay lại sau.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {opportunities.map(req => {
                        const isOffered = myOfferRequestIds.has(req.id)

                        return (
                            <div key={req.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                {isOffered && (
                                    <div className="absolute top-0 right-0 bg-green-50 text-green-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-green-100 flex items-center gap-1 z-10">
                                        <CheckCircle className="w-3 h-3" />
                                        Đã báo giá
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="default" className="bg-primary-50 text-primary-700 border-primary-100 border font-normal">
                                                {req.category?.name || 'Chung'}
                                            </Badge>
                                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: vi })}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                                            {req.title}
                                        </h3>

                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                                            <span className="bg-gray-50 px-2 py-1 rounded-md">
                                                {req.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                                            </span>
                                            {req.budget && (
                                                <span className="text-gray-900 bg-gray-50 px-2 py-1 rounded-md">
                                                    Ngân sách: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(req.budget)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto mt-4 md:mt-0">
                                        <Link href={`/requests/${req.id}`}>
                                            <Button
                                                className={clsx(
                                                    "w-full md:w-auto font-bold",
                                                    isOffered ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" : "premium-gradient border-none text-white shadow-lg shadow-primary-500/20"
                                                )}
                                            >
                                                {isOffered ? 'Xem chi tiết' : 'Xem chi tiết & Báo giá'}
                                                {!isOffered && <ChevronRight className="w-4 h-4 ml-1" />}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
