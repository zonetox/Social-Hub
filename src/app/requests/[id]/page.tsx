'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { OfferForm } from '@/components/marketplace/OfferForm'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { LayoutDashboard, Clock, User, DollarSign, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function RequestDetailPage() {
    const { id } = useParams()
    const { user } = useAuth()
    const supabase = createClient()

    const [request, setRequest] = useState<any>(null)
    const [offers, setOffers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [myOffer, setMyOffer] = useState<any>(null)

    const fetchData = useCallback(async () => {
        if (!user || !id) return

        setLoading(true)
        // 1. Fetch Request
        const { data: reqData, error } = await supabase
            .from('service_requests')
            .select(`
                *,
                category:profile_categories(name, icon),
                creator:users(full_name, avatar_url)
            `)
            .eq('id', id)
            .single()

        if (error || !reqData) {
            console.error('Error fetching request', error)
            setLoading(false)
            return
        }

        setRequest(reqData)

        // 2. Fetch Offers (RLS filters this)
        const { data: offersData } = await supabase
            .from('service_offers')
            .select(`
                *,
                profile:profiles(id, display_name, slug, user:users(avatar_url))
            `)
            .eq('request_id', id)
            .order('created_at', { ascending: false })

        if (offersData) {
            setOffers(offersData)

            // Allow checking if I already sent an offer
            // Find offer where profile->user_id == me
            // Since we joined profile, we can check but getting user_id from profile join is tricky if not selected
            // But RLS says I can see my own offer.
            // If I am NOT the owner, I should only see MY offer essentially (or none).
            // Actually RLS: "View own offer OR Request owner".
            // So if I am provider, `offersData` will containing ONLY my offer if it exists.
            if (reqData.created_by_user_id !== user.id) {
                if (offersData.length > 0) {
                    setMyOffer(offersData[0])
                }
            }
        }

        setLoading(false)
    }, [id, user])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>
    if (!request) return <div className="text-center py-20">Không tìm thấy yêu cầu hoặc bạn không có quyền xem.</div>

    const isOwner = user?.id === request.created_by_user_id

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Request Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            {request.category && (
                                <Badge className="bg-primary-50 text-primary-700 hover:bg-primary-100 trantision-colors">
                                    {request.category.name}
                                </Badge>
                            )}
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: vi })}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6 leading-tight">
                            {request.title}
                        </h1>

                        <div className="prose prose-gray max-w-none mb-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed font-medium">
                                {request.description}
                            </p>
                        </div>
                    </div>

                    {/* Offers Section */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary-500" />
                            {isOwner ? `Danh sách báo giá (${offers.length})` : 'Gửi báo giá'}
                        </h2>

                        {isOwner ? (
                            <div className="space-y-4">
                                {offers.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500">
                                        Chưa có báo giá nào.
                                    </div>
                                ) : (
                                    offers.map(offer => (
                                        <div key={offer.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    {offer.profile?.user?.avatar_url ? (
                                                        <Image
                                                            src={offer.profile.user.avatar_url}
                                                            alt={offer.profile.display_name}
                                                            width={40} height={40}
                                                            className="rounded-full object-cover border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                                                            {offer.profile?.display_name?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <Link href={`/${offer.profile.slug}`} className="font-bold text-gray-900 hover:underline">
                                                            {offer.profile.display_name}
                                                        </Link>
                                                        <p className="text-xs text-gray-500">
                                                            {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: vi })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant={offer.price ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                                                    {offer.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(offer.price) : 'Thương lượng'}
                                                </Badge>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg text-gray-700 text-sm whitespace-pre-wrap">
                                                {offer.message}
                                            </div>
                                            <div className="mt-3 flex justify-end">
                                                <a href={`tel:${offer.profile.phone || ''}#placeholder`} onClick={(e) => { e.preventDefault(); toast.info("Tính năng liên hệ đang phát triển") }}>
                                                    <Button size="sm" variant="outline">Liên hệ lại</Button>
                                                </a>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div>
                                {myOffer ? (
                                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Send className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-blue-900 mb-1">Bạn đã gửi báo giá</h3>
                                        <p className="text-blue-700 mb-4">{myOffer.message}</p>
                                        <Badge className="bg-blue-200 text-blue-800 border-none">
                                            {myOffer.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(myOffer.price) : 'Thương lượng'}
                                        </Badge>
                                    </div>
                                ) : (
                                    <OfferForm requestId={request.id} onSuccess={fetchData} />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Sidebar Creator Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
                        <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Người yêu cầu</h3>
                        <div className="flex items-center gap-4 mb-4">
                            {/* Note: Creator might not have a public profile if they are just a User. 
                                 We join 'creator:users' to get name/avatar. */}
                            {request.creator?.avatar_url ? (
                                <Image
                                    src={request.creator.avatar_url}
                                    width={56} height={56}
                                    alt="Creator"
                                    className="rounded-full object-cover border-2 border-white shadow-md"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 shadow-inner">
                                    {request.creator?.full_name?.charAt(0)}
                                </div>
                            )}
                            <div>
                                <div className="font-bold text-gray-900">{request.creator?.full_name || 'Người dùng ẩn danh'}</div>
                                <div className="text-xs text-green-600 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Online gần đây
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4 mt-4 text-xs text-gray-500 text-center">
                            Thông tin liên hệ sẽ được hiển thị khi bạn gửi báo giá được chấp nhận.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
