'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Check, Copy, CreditCard, Upload } from 'lucide-react'
import clsx from 'clsx'

const CREDIT_PACKAGES = [
    { id: 'pack_5', credits: 5, price: 50000, label: 'Gói Cơ Bản' },
    { id: 'pack_10', credits: 10, price: 90000, label: 'Gói Phổ Biến', popular: true },
    { id: 'pack_30', credits: 30, price: 250000, label: 'Gói Tiết Kiệm' }
]

export default function BuyCreditsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = createClient()

    const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1])
    const [bankInfo, setBankInfo] = useState<any>(null)
    const [uploading, setUploading] = useState(false)
    const [proofUrl, setProofUrl] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [currentCredits, setCurrentCredits] = useState(0)

    useEffect(() => {
        const fetchInfo = async () => {
            if (!user) return

            // Get Bank Info
            const { data: bank } = await supabase
                .from('bank_transfer_info')
                .select('*')
                .eq('is_active', true)
                .single()
            if (bank) setBankInfo(bank)

            // Get Current Credits
            const { data: credit } = await (supabase
                .from('card_credits') as any)
                .select('amount')
                .eq('user_id', user.id)
                .single()
            if (credit) setCurrentCredits(credit.amount)
        }
        fetchInfo()
    }, [user])

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Đã sao chép!')
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        setUploading(true)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user?.id}/${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('payment-proofs')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('payment-proofs')
                .getPublicUrl(filePath)

            setProofUrl(publicUrl)
            toast.success('Tải ảnh lên thành công!')
        } catch (error) {
            console.error('Upload failed:', error)
            toast.error('Tải ảnh thất bại. Vui lòng thử lại.')
        } finally {
            setUploading(false)
        }
    }

    const handlePurchase = async () => {
        if (!proofUrl) {
            toast.error('Vui lòng tải lên ảnh chụp chuyển khoản.')
            return
        }

        setSubmitting(true)
        try {
            const response = await fetch('/api/credits/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packageId: selectedPackage.id,
                    credits: selectedPackage.credits,
                    amountVnd: selectedPackage.price,
                    proofUrl
                })
            })
            const result = await response.json()

            if (result.success) {
                toast.success('Gửi yêu cầu mua thành công! Vui lòng chờ xác nhận.')
                router.push('/dashboard') // Or confirmation page
            } else {
                toast.error(result.message || 'Có lỗi xảy ra.')
            }
        } catch (error) {
            console.error(error)
            toast.error('Lỗi kết nối.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Mua Credit</h1>
            <p className="text-gray-500 mb-8">Mua thêm credit để gửi yêu cầu và báo giá không giới hạn.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Package Selection */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Số dư hiện tại</h3>
                            <span className="text-2xl font-black text-primary-600">{currentCredits} Credits</span>
                        </div>

                        <div className="space-y-3">
                            {CREDIT_PACKAGES.map(pkg => (
                                <div
                                    key={pkg.id}
                                    onClick={() => setSelectedPackage(pkg)}
                                    className={clsx(
                                        "cursor-pointer p-4 rounded-xl border-2 transition-all flex justify-between items-center",
                                        selectedPackage.id === pkg.id
                                            ? "border-primary-500 bg-primary-50"
                                            : "border-gray-100 hover:border-gray-200"
                                    )}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{pkg.label}</span>
                                            {pkg.popular && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">Best Seller</span>}
                                        </div>
                                        <p className="text-sm text-gray-500">{pkg.credits} Credit bổ sung</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-lg text-primary-600">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.price)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right: Payment Info */}
                <div className="space-y-6">
                    <Card className="p-6 bg-gray-50 border-dashed">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-gray-600" />
                            Thông tin chuyển khoản
                        </h3>

                        {bankInfo ? (
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ngân hàng</span>
                                    <span className="font-bold">{bankInfo.bank_name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Số tài khoản</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg text-gray-900 tracking-wider">{bankInfo.account_number}</span>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleCopy(bankInfo.account_number)}>
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Chủ tài khoản</span>
                                    <span className="font-bold uppercase">{bankInfo.account_holder}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                    <span className="text-gray-500">Nội dung CK</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-primary-600">CREDIT {user?.id.slice(0, 8)}</span>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleCopy(`CREDIT ${user?.id.slice(0, 8)}`)}>
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-center text-gray-400 mt-2">
                                    *Vui lòng ghi đúng nội dung để được duyệt tự động nhanh nhất.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 italic">Đang tải thông tin ngân hàng...</div>
                        )}
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-gray-600" />
                            Xác nhận thanh toán
                        </h3>

                        {!proofUrl ? (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary-500 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />
                                {uploading ? (
                                    <span className="text-gray-500">Đang tải lên...</span>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Nhấn để tải lên ảnh chụp màn hình giao dịch</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                <img src={proofUrl} alt="Proof" className="w-full h-48 object-cover" />
                                <button
                                    onClick={() => setProofUrl('')}
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                                >
                                    <span className="sr-only">Xóa</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                <div className="absolute inset-x-0 bottom-0 bg-green-500/90 text-white text-xs px-2 py-1 flex items-center justify-center gap-1">
                                    <Check className="w-3 h-3" /> Đã tải ảnh lên
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full mt-6 premium-gradient h-12 text-base font-bold shadow-lg shadow-primary-500/20"
                            onClick={handlePurchase}
                            disabled={submitting || !proofUrl}
                            isLoading={submitting}
                        >
                            Xác nhận mua {selectedPackage.credits} Credits
                            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-sm">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPackage.price)}
                            </span>
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    )
}
