'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Send } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { QuotaUpsellModal } from '@/components/ui/QuotaUpsellModal'

interface OfferFormProps {
    requestId: string
    onSuccess?: () => void
}

export function OfferForm({ requestId, onSuccess }: OfferFormProps) {
    const { user } = useAuth()
    const supabase = createClient()

    const [submitting, setSubmitting] = useState(false)
    const [quotaState, setQuotaState] = useState({ isOpen: false, quota: 0, used: 0 })
    const [formData, setFormData] = useState({
        message: '',
        price: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSubmitting(true)
        try {
            // 1. Check & Consume Quota via API
            const quotaRes = await fetch('/api/quota/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_offer', consume: true })
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

            // 2. Get User Profile ID (assume first one)
            const { data: profile } = await (supabase.from('profiles') as any).select('id').eq('user_id', user.id).single()
            if (!profile) {
                toast.error('Bạn chưa có hồ sơ (Profile) để gửi báo giá.')
                setSubmitting(false)
                return
            }

            // 3. Insert Offer
            const { error } = await (supabase.from('service_offers') as any).insert({
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

                // 4. Trigger Warning (Async) via API
                fetch('/api/quota/warning', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'create_offer' })
                }).catch(console.error)

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
        <>
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

            <QuotaUpsellModal
                isOpen={quotaState.isOpen}
                onClose={() => setQuotaState(prev => ({ ...prev, isOpen: false }))}
                quota={quotaState.quota}
                used={quotaState.used}
                title="Hết lượt gửi báo giá"
            />
        </>
    )
}
