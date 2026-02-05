'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Clock, Briefcase, Tag } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function LatestRequests() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const { data } = await supabase
                    .from('service_requests')
                    .select(`
                        id,
                        title,
                        description,
                        created_at,
                        status,
                        budget,
                        category:profile_categories(name)
                    `)
                    .eq('status', 'open')
                    .order('created_at', { ascending: false })
                    .limit(8)
                if (data) setRequests(data)
            } catch (error) {
                console.error('Error fetching requests:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchRequests()
    }, [])

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-[2rem]" />
                ))}
            </div>
        )
    }

    if (requests.length === 0) return null

    return (
        <section className="py-16">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2 uppercase flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-primary-600 fill-current" />
                        Yêu cầu báo giá mới nhất
                    </h2>
                    <p className="text-gray-500 font-medium text-lg">Cơ hội kinh doanh thực tế từ thị trường</p>
                </div>
                <Link href="/requests">
                    <Button variant="ghost" className="text-primary-600 hover:bg-primary-50 font-bold group px-6">
                        Xem tất cả yêu cầu <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {requests.map((req) => (
                    <Link key={req.id} href={`/requests/${req.id}`} className="block h-full">
                        <div className="group bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-primary-200 transition-all duration-500 h-full flex flex-col relative overflow-hidden">
                            {/* Glow Effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-50 to-transparent -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50" />

                            <div className="relative z-10 flex flex-col h-full">
                                <h3 className="font-black text-gray-900 leading-tight mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors text-lg">
                                    {req.title}
                                </h3>

                                <p className="text-gray-500 text-sm line-clamp-3 mb-6 font-medium">
                                    {req.description || 'Không có mô tả chi tiết...'}
                                </p>

                                <div className="mt-auto">
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-bold mb-4 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5 text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full">
                                            <Tag className="w-3.5 h-3.5" />
                                            {req.category?.name || 'Chung'}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(req.created_at).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="text-primary-600 font-black text-xs uppercase tracking-widest flex items-center gap-1 group/btn">
                                            Xem chi tiết <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                        </div>
                                        {req.budget && (
                                            <span className="text-gray-900 font-black text-sm">{req.budget}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
