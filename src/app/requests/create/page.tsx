'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { QuotaUpsellModal } from '@/components/ui/QuotaUpsellModal'

export default function CreateRequestPage() {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    const [categories, setCategories] = useState<any[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [quotaState, setQuotaState] = useState({ isOpen: false, quota: 0, used: 0 })

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: ''
    })

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('profile_categories')
                .select('*')
                .order('name')

            if (data) setCategories(data)
        }
        fetchCategories()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSubmitting(true)

        try {
            // 1. Check & Consume Quota (Subscription or Credit) via API
            const quotaRes = await fetch('/api/quota/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_request', consume: true })
            })

            const quotaResult = await quotaRes.json()

            if (!quotaResult.allowed) {
                setQuotaState({
                    isOpen: true,
                    quota: quotaResult.quota,
                    used: quotaResult.used
                })
                setSubmitting(false)
                return
            }

            if (quotaResult.source === 'credit') {
                toast.dismiss()
                toast.success(`Đã dùng 1 lượt mua thêm. Còn lại: ${quotaResult.creditsRemaining}`)
            }

            // 2. Insert Request
            const { data, error } = await (supabase
                .from('service_requests') as any)
                .insert({
                    created_by_user_id: user.id,
                    title: formData.title,
                    description: formData.description,
                    category_id: formData.category_id,
                    status: 'open'
                })

            if (error) throw error

            toast.success('Đã gửi yêu cầu thành công!')

            // 3. Trigger 80% Warning (Async) via API
            fetch('/api/quota/warning', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_request' })
            }).catch(console.error)

            router.push('/dashboard')

        } catch (error) {
            console.error('Error creating request:', error)
            toast.error('Có lỗi xảy ra khi tạo yêu cầu.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <Link href="/requests" className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại danh sách
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Gửi Yêu Cầu Dịch Vụ</h1>
                <p className="text-gray-500">Mô tả nhu cầu của bạn để tìm được chuyên gia phù hợp.</p>
            </div>

            <Card className="p-6 sm:p-8 bg-white/50 backdrop-blur-xl border-white/50 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Tiêu đề yêu cầu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ví dụ: Cần tìm nhiếp ảnh gia cho đám cưới..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none bg-white/50"
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Danh mục <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none bg-white/50"
                            value={formData.category_id}
                            onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                        >
                            <option value="">Chọn danh mục dịch vụ</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Mô tả chi tiết <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={5}
                            placeholder="Mô tả chi tiết yêu cầu của bạn (thời gian, địa điểm, ngân sách dự kiến...)"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none bg-white/50 resize-y"
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-bold premium-gradient border-none shadow-lg hover:shadow-primary-500/25 rounded-xl"
                            isLoading={submitting}
                            disabled={submitting}
                        >
                            {submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Ngay'}
                            {!submitting && <Send className="w-4 h-4 ml-2" />}
                        </Button>
                        <p className="text-xs text-center text-gray-400 mt-4">
                            Yêu cầu của bạn sẽ được gửi tới các chuyên gia trong danh mục đã chọn.
                        </p>
                    </div>
                </form>
            </Card>

            <QuotaUpsellModal
                isOpen={quotaState.isOpen}
                onClose={() => setQuotaState(prev => ({ ...prev, isOpen: false }))}
                quota={quotaState.quota}
                used={quotaState.used}
                title="Hết lượt gửi yêu cầu"
            />
        </div>
    )
}
