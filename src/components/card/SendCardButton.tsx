'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Send, AlertCircle, CheckCircle } from 'lucide-react'

interface SendCardButtonProps {
    receiverId: string
    receiverName: string
    profileId: string
}

export function SendCardButton({ receiverId, receiverName, profileId }: SendCardButtonProps) {
    const { user } = useAuth()
    const { cardBalance, canSendCard, refreshBalance } = useSubscription()
    const [showModal, setShowModal] = useState(false)
    const [sending, setSending] = useState(false)
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    const handleSendCard = async () => {
        if (!user || !canSendCard) return

        setSending(true)
        try {
            // Deduct credit using RPC
            const { data: canDeduct, error: deductError } = await (supabase as any)
                .rpc('deduct_card_credit', { p_user_id: user.id })

            if (deductError || !canDeduct) {
                throw new Error('Insufficient card credits or failed to deduct')
            }

            // Create card send record
            const { error: sendError } = await (supabase.from('card_sends') as any).insert({
                sender_id: user.id,
                receiver_id: receiverId,
                profile_id: profileId
            })

            if (sendError) throw sendError

            // Note: In a real app, you might trigger an edge function or webhook here for emails
            // For now, we simulate the success state locally

            setSuccess(true)
            await refreshBalance()

            setTimeout(() => {
                setSuccess(false)
                setShowModal(false)
            }, 2000)

        } catch (error: any) {
            console.error('Send card error:', error)
            alert(error.message || 'Failed to send card')
        } finally {
            setSending(false)
        }
    }

    if (!user || user.id === receiverId) {
        return null
    }

    return (
        <>
            <Button
                size="sm"
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowModal(true)
                }}
                disabled={!canSendCard}
                className="rounded-xl"
            >
                <Send className="w-4 h-4 mr-2" />
                Send Card
            </Button>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Send Profile Card"
                size="md"
            >
                {success ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Card Sent!</h3>
                        <p className="text-gray-600">
                            Your profile card has been sent to <span className="font-bold">{receiverName}</span>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                            <h3 className="font-bold text-primary-900 mb-2 flex items-center gap-2">
                                <Send className="w-5 h-5" />
                                Connect with {receiverName}
                            </h3>
                            <p className="text-sm text-primary-800 leading-relaxed">
                                Send your digital profile card so they can follow all your social accounts with one click.
                                They will be notified of your connection request.
                            </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Your Balance</p>
                                    <p className="text-3xl font-black text-gray-900">{cardBalance} credits</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Cost</p>
                                    <p className="text-3xl font-black text-primary-600">1 credit</p>
                                </div>
                            </div>

                            {!canSendCard && (
                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-yellow-800 font-bold">Insufficient credits</p>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            You need at least 1 credit to send a card.
                                        </p>
                                        <a href="/pricing" className="text-xs text-primary-600 font-bold hover:underline mt-2 block">
                                            Buy more credits now →
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                            <h4 className="font-bold text-gray-900 text-sm">Features:</h4>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    Instant notification to receiver
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    Receiver can see all your links
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    Track when your card is viewed
                                </li>
                            </ul>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowModal(false)}
                                className="flex-1 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendCard}
                                disabled={!canSendCard || sending}
                                isLoading={sending}
                                className="flex-1 rounded-xl premium-gradient border-none shadow-lg"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Send Now
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    )
}
