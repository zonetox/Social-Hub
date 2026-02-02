'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Send, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function CreateRequestPage() {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

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

    const checkQuota = async () => {
        if (!user) return false

        // 1. Get current month start
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        // 2. Count existing requests this month
        const { count, error: countError } = await supabase
            .from('service_requests')
            .select('*', { count: 'exact', head: true })
            .eq('created_by_user_id', user.id)
            .gte('created_at', startOfMonth)

        if (countError) {
            console.error('Error counting requests', countError)
            return false // Fail safe
        }

        // 3. Get User Subscription & Plan Features
        const { data: subscription, error: subError } = await supabase
            .from('user_subscriptions')
            .select(`
                *,
                plan:subscription_plans(features)
            `)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gte('expires_at', new Date().toISOString())
            .single()

        // Default quota if no subscription (or free tier if logic dictates)
        // Assuming "STANDARD" (Free) has 5. 
        // If no active sub found, they might be on a basic/default tier?
        // Let's assume strict: Must have sub? Or use fallback?
        // Existing feature uses `user_subscriptions`. If no sub, maybe 0 quota?

        let quota = 0
        if (subscription && subscription.plan && subscription.plan.features) {
            const features = subscription.plan.features as any
            quota = features.request_quota_per_month || 0
        } else {
            // Check for a default plan or assume 0?
            // "Standard" plan usually has price 0. Users should be subscribed to it?
            // If they are not subscribed, they probably can't post.
            // Let's assume 0.
            // Wait, the user prompt says: "Compare with: subscription_plans.features...".
        }

        if ((count || 0) >= quota) {
            return false // Quota exceeded
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSubmitting(true)

        try {
            // 1. Check Quota
            const hasQuota = await checkQuota()
            if (!hasQuota) {
                toast.error('Bạn đã hết lượt tạo yêu cầu trong tháng này. Hãy nâng cấp gói!', {
                    icon: '🔒',
                    action: {
                        label: 'Nâng cấp',
                        onClick: () => router.push('/pricing')
                    }
                })
                setSubmitting(false)
                return
            }

            // 2. Insert Request
            const { error } = await supabase
                .from('service_requests')
                .insert({
                    created_by_user_id: user.id,
                    title: formData.title,
                    description: formData.description,
                    category_id: formData.category_id,
                    status: 'open'
                })

            if (error) throw error

            toast.success('Đã gửi yêu cầu thành công!')
            router.push('/dashboard/requests')

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
        </div>
    )
}
