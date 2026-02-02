'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'
import { RequestCard } from '@/components/marketplace/RequestCard'
import { Button } from '@/components/ui/Button'
import { Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export default function RequestsPage() {
    const { user } = useAuth()
    const supabase = createClient()

    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRequests = async () => {
            if (!user) {
                setLoading(false)
                return
            }

            // RLS policies will automatically filter this
            // We select category info too
            const { data, error } = await supabase
                .from('service_requests')
                .select(`
                    *,
                    category:profile_categories(name, icon, slug)
                `)
                .order('created_at', { ascending: false })

            if (data) {
                setRequests(data)
            }
            setLoading(false)
        }

        fetchRequests()
    }, [user])

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-1">Sàn Yêu Cầu</h1>
                    <p className="text-gray-500">Cơ hội kinh doanh dành cho bạn (Dựa trên danh mục hồ sơ của bạn)</p>
                </div>
                <Link href="/requests/create">
                    <Button className="premium-gradient border-none shadow-lg hover:shadow-primary-500/25">
                        <Plus className="w-5 h-5 mr-2" />
                        Gửi Yêu Cầu Mới
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có yêu cầu nào phù hợp</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Hiện chưa có khách hàng nào gửi yêu cầu trong lĩnh vực của bạn.
                        Hoặc bạn cần cập nhật danh mục hồ sơ để thấy nhiều hơn.
                    </p>
                    <Link href="/dashboard/profile">
                        <Button variant="outline">Cập nhật hồ sơ</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.map(req => (
                        <RequestCard
                            key={req.id}
                            request={req}
                            isOwner={user?.id === req.created_by_user_id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
