'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Plus, XCircle, Eye } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import clsx from 'clsx'

export default function MyRequestsPage() {
    const { user } = useAuth()
    const supabase = createClient()

    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRequests = async () => {
        if (!user) return

        const { data, error } = await supabase
            .from('my_requests_summary')
            .select('*')
            .eq('created_by_user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error(error)
            toast.error('Lỗi tải danh sách yêu cầu')
        }

        if (data) setRequests(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchRequests()
    }, [user])

    const handleCloseRequest = async (requestId: string) => {
        if (!confirm('Bạn có chắc chắn muốn đóng yêu cầu này? Sau khi đóng, bạn sẽ không nhận được báo giá mới.')) return

        const { error } = await supabase
            .from('service_requests')
            .update({
                status: 'closed',
                closed_at: new Date().toISOString()
            })
            .eq('id', requestId)
            .eq('created_by_user_id', user?.id || '') // Extra safety

        if (error) {
            toast.error('Không thể đóng yêu cầu. Vui lòng thử lại.')
        } else {
            toast.success('Đã đóng yêu cầu thành công.')
            fetchRequests() // Refresh
        }
    }

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Yêu Cầu Của Tôi</h1>
                    <p className="text-gray-500">Quản lý các yêu cầu dịch vụ bạn đã gửi</p>
                </div>
                <Link href="/requests/create">
                    <Button className="premium-gradient border-none shadow-md">
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo yêu cầu mới
                    </Button>
                </Link>
            </div>

            {requests.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 mb-4">Bạn chưa tạo yêu cầu nào.</p>
                    <Link href="/requests/create">
                        <Button variant="outline">Tạo yêu cầu ngay</Button>
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tiêu đề</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Danh mục</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Báo giá</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Ngày tạo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map(req => (
                                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <Link href={`/requests/${req.id}`} className="font-bold text-gray-900 hover:text-primary-600 block max-w-xs truncate">
                                                {req.title}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {req.category_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={req.status === 'open' ? 'success' : 'secondary'} className={clsx(
                                                "capitalize",
                                                req.status === 'open' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {req.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                                                {req.offer_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                                            {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: vi })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/requests/${req.id}`}>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-primary-600">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                {req.status === 'open' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleCloseRequest(req.id)}
                                                        title="Đóng yêu cầu"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
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
