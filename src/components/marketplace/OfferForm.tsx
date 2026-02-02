'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface OfferFormProps {
    requestId: string
    onSuccess?: () => void
}

export function OfferForm({ requestId, onSuccess }: OfferFormProps) {
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()

    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        message: '',
        price: ''
    })

    const checkOfferQuota = async () => {
        if (!user) return false

        // 1. Month start
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        // 2. Count offers created by any profile owned by user
        // We need to join manually or use 2 steps? 
        // Logic: SELECT COUNT(*) FROM service_offers so JOIN profiles p ON p.id = so.profile_id ...
        // Supabase-js syntax for join count is tricky.
        // Step 2a: Get my profile IDs
        const { data: profiles } = await supabase.from('profiles').select('id').eq('user_id', user.id)
        if (!profiles || profiles.length === 0) return false // No profile, can't offer

        const profileIds = profiles.map(p => p.id)

        // Step 2b: Count offers by these profiles
        const { count, error } = await supabase
            .from('service_offers')
            .select('*', { count: 'exact', head: true })
            .in('profile_id', profileIds)
            .gte('created_at', startOfMonth)

        if (error) {
            console.error(error)
            return false
        }

        // 3. Get Subscription Features
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select(`*, plan:subscription_plans(features)`)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gte('expires_at', new Date().toISOString())
            .single()

        let quota = 0
        if (subscription && subscription.plan && subscription.plan.features) {
            const features = subscription.plan.features as any
            quota = features.offer_quota_per_month || 0
        }

        if ((count || 0) >= quota) {
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSubmitting(true)
        try {
            // 1. Check Quota
            const hasQuota = await checkOfferQuota()
            if (!hasQuota) {
                toast.error('Bạn đã hết lượt gửi báo giá trong tháng này.', {
                    action: { label: 'Nâng cấp', onClick: () => router.push('/pricing') }
                })
                setSubmitting(false)
                return
            }

            // 2. Get User Profile ID (assume first one)
            const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
            if (!profile) {
                toast.error('Bạn chưa có hồ sơ (Profile) để gửi báo giá.')
                return
            }

            // 3. Insert Offer
            const { error } = await supabase.from('service_offers').insert({
                request_id: requestId,
                profile_id: profile.id,
                message: formData.message,
                price: formData.price ? parseFloat(formData.price) : null,
                status: 'sent'
            })

            if (error) {
                if (error.code === '23505') { // Unique violation
                    toast.error('Bạn đã gửi báo giá cho yêu cầu này rồi.')
                } else {
                    throw error
                }
            } else {
                toast.success('Gửi báo giá thành công!')
                setFormData({ message: '', price: '' })
                onSuccess?.()
            }

        } catch (error) {
            console.error('Error sending offer:', error)
            toast.error('Lỗi khi gửi báo giá.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/40 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Gửi báo giá của bạn</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chi phí dự kiến (VNĐ) <span className="text-gray-400 text-xs font-normal">(Để trống nếu thương lượng)</span>
                    </label>
                    <input
                        type="number"
                        placeholder="VD: 500000"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        value={formData.price}
                        onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lời nhắn / Đề xuất <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        required
                        rows={3}
                        placeholder="Chào bạn, tôi có thể..."
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                        value={formData.message}
                        onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full premium-gradient border-none"
                    isLoading={submitting}
                >
                    <Send className="w-4 h-4 mr-2" />
                    Gửi Báo Giá
                </Button>
            </div>
        </form>
    )
}
