'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { TrendingUp, Send, CheckCircle, Filter } from 'lucide-react'
import clsx from 'clsx'

export default function BusinessOIDashboard() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [metrics, setMetrics] = useState({ opportunities: 0, offersSent: 0, requestsClosed: 0 })
    const [filter, setFilter] = useState<'month' | 'all'>('month')

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return
            setLoading(true)
            try {
                const response = await fetch('/api/analytics/roi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timeRange: filter })
                })
                const data = await response.json()
                setMetrics(data)
            } catch (error) {
                console.error('Failed to fetch ROI:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [user, filter])

    const stats = [
        {
            label: 'Cơ hội trong ngành',
            value: metrics.opportunities,
            icon: TrendingUp,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            desc: 'Yêu cầu mới phù hợp với danh mục của bạn'
        },
        {
            label: 'Báo giá đã gửi',
            value: metrics.offersSent,
            icon: Send,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
            desc: 'Số lượng báo giá bạn đã gửi đi'
        },
        {
            label: 'Yêu cầu đã đóng',
            value: metrics.requestsClosed,
            icon: CheckCircle,
            color: 'text-green-500',
            bg: 'bg-green-50',
            desc: 'Các yêu cầu bạn tham gia đã hoàn thành'
        }
    ]

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Hiệu Quả Kinh Doanh (ROI)</h1>
                    <p className="text-gray-500">Theo dõi hiệu suất và cơ hội của bạn trên SocialHub</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setFilter('month')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            filter === 'month' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Tháng này
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            filter === 'all' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Toàn bộ
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><LoadingSpinner /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, index) => (
                        <Card key={index} className="p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className={clsx("p-3 rounded-xl", stat.bg)}>
                                    <stat.icon className={clsx("w-6 h-6", stat.color)} />
                                </div>
                                <span className={clsx("text-3xl font-black", stat.color)}>
                                    {stat.value}
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{stat.label}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{stat.desc}</p>
                        </Card>
                    ))}
                </div>
            )}

            {/* Insight Section (Placeholder for future) */}
            <div className="mt-8 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-2xl p-6 border border-primary-100">
                <h3 className="font-bold text-primary-900 mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500 fill-current" />
                    Mẹo tăng trưởng
                </h3>
                <ul className="space-y-2 text-sm text-primary-800">
                    <li>• Nâng cấp hồ sơ VIP để hiển thị nổi bật hơn trước khách hàng.</li>
                    <li>• Phản hồi báo giá nhanh trong vòng 1 giờ để tăng tỷ lệ chốt đơn.</li>
                    <li>• Cập nhật Portfolio thường xuyên để thu hút nhiều lượt xem hơn.</li>
                </ul>
            </div>
        </div>
    )
}

// Icon for tip
function Zap({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
    )
}
