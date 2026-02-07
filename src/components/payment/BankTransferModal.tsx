'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Upload, Copy, Check, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { BankTransferInfo, SubscriptionPlan } from '@/types/payment.types'

interface BankTransferModalProps {
    isOpen: boolean
    onClose: () => void
    plan?: SubscriptionPlan
    creditAmount?: number
}

export function BankTransferModal({
    isOpen,
    onClose,
    plan,
    creditAmount
}: BankTransferModalProps) {
    const { user } = useAuth()
    const [banks, setBanks] = useState<BankTransferInfo[]>([])
    const [selectedBank, setSelectedBank] = useState<BankTransferInfo | null>(null)
    const [proofImage, setProofImage] = useState<File | null>(null)
    const [proofUrl, setProofUrl] = useState('')
    const [notes, setNotes] = useState('')
    const [uploading, setUploading] = useState(false)
    const [copied, setCopied] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (isOpen) {
            fetchBanks()
        }
    }, [isOpen])

    const fetchBanks = async () => {
        const { data } = await (supabase.from('bank_transfer_info') as any)
            .select('*')
            .eq('is_active', true)
            .eq('country', 'VN')

        if (data) {
            setBanks(data as unknown as BankTransferInfo[])
            setSelectedBank(data[0] as unknown as BankTransferInfo)
        }
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user?.id}/payment-proof-${Date.now()}.${fileExt}`

            const { error: uploadError } = await (supabase.storage
                .from('payment-proofs') as any)
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = (supabase.storage
                .from('payment-proofs') as any)
                .getPublicUrl(fileName)

            setProofUrl(publicUrl)
            setProofImage(file)
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload image')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async () => {
        if (!user || !selectedBank || !proofUrl) {
            toast.error('Please upload payment proof')
            return
        }

        try {
            const amount = plan ? plan.price_vnd : (creditAmount || 100) * 250 // 1 credit = 250 VND

            await (supabase.from('payment_transactions') as any).insert({
                user_id: user.id,
                type: plan ? 'subscription' : 'credits',
                amount_usd: plan ? plan.price_usd : (creditAmount || 100) * 0.01,
                amount_vnd: amount,
                currency: 'VND',
                payment_method: 'bank_transfer',
                status: 'pending',
                proof_image_url: proofUrl,
                notes: notes,
                metadata: {
                    bank_id: selectedBank.id,
                    plan_id: plan?.id,
                    credit_amount: creditAmount
                }
            })

            toast.success('Payment submitted! We will verify and activate your account within 24 hours.')
            onClose()
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Failed to submit payment')
        }
    }

    if (!selectedBank) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bank Transfer Payment" size="lg">
            <div className="space-y-6">
                {/* Amount Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Payment Amount</h3>
                    {plan ? (
                        <div>
                            <p className="text-2xl font-bold text-blue-900">
                                {plan.price_vnd?.toLocaleString('vi-VN')} VNĐ
                            </p>
                            <p className="text-sm text-blue-700">{plan.name}</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-2xl font-bold text-blue-900">
                                {((creditAmount || 100) * 250).toLocaleString('vi-VN')} VNĐ
                            </p>
                            <p className="text-sm text-blue-700">{creditAmount} Card Credits</p>
                        </div>
                    )}
                </div>

                {/* Bank Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Bank
                    </label>
                    <select
                        value={selectedBank.id}
                        onChange={(e) => setSelectedBank(banks.find(b => b.id === e.target.value) || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                        {banks.map(bank => (
                            <option key={bank.id} value={bank.id}>
                                {bank.bank_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Bank Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Account Holder</p>
                            <p className="font-semibold text-gray-900">{selectedBank.account_holder}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Account Number</p>
                            <p className="font-semibold text-gray-900">{selectedBank.account_number}</p>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(selectedBank.account_number)}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600">Bank</p>
                        <p className="font-semibold text-gray-900">{selectedBank.bank_name}</p>
                    </div>

                    {selectedBank.branch && (
                        <div>
                            <p className="text-sm text-gray-600">Branch</p>
                            <p className="font-semibold text-gray-900">{selectedBank.branch}</p>
                        </div>
                    )}
                </div>

                {/* Transfer Content */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important</h4>
                    <p className="text-sm text-yellow-800 mb-2">
                        Please include this in transfer content:
                    </p>
                    <div className="flex items-center justify-between bg-white p-2 rounded border border-yellow-300">
                        <code className="text-sm font-mono">{user?.username} - {plan ? 'SUB' : 'CREDITS'}</code>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(`${user?.username} - ${plan ? 'SUB' : 'CREDITS'}`)}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                {/* Upload Proof */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Payment Proof *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {proofImage ? (
                            <div>
                                <img
                                    src={URL.createObjectURL(proofImage)}
                                    alt="Payment proof"
                                    className="max-w-full h-48 mx-auto mb-2 rounded"
                                />
                                <p className="text-sm text-gray-600">{proofImage.name}</p>
                            </div>
                        ) : (
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">
                                    {uploading ? 'Uploading...' : 'Click to upload screenshot'}
                                </p>
                            </label>
                        )}
                    </div>
                </div>

                {/* Notes */}
                <Input
                    label="Notes (Optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information..."
                />

                {/* Instructions */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">📝 Instructions:</h4>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                        <li>Transfer exact amount to the bank account above</li>
                        <li>Include the transfer content exactly as shown</li>
                        <li>Take a screenshot of successful transfer</li>
                        <li>Upload screenshot and submit</li>
                        <li>We&apos;ll verify and activate within 24 hours</li>
                    </ol>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!proofUrl || uploading}
                        className="flex-1"
                    >
                        Submit Payment
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
