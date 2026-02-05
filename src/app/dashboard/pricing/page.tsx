'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { PricingCard } from '@/components/payment/PricingCard'
import { BankTransferModal } from '@/components/payment/BankTransferModal'
import { PayPalButton } from '@/components/payment/PayPalButton'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CreditCard, Building, DollarSign } from 'lucide-react'
import type { SubscriptionPlan } from '@/types/payment.types'

export default function PricingPage() {
    const { user } = useAuth()
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
    const [showBankTransfer, setShowBankTransfer] = useState(false)
    const [showPayPal, setShowPayPal] = useState(false)
    const [creditAmount, setCreditAmount] = useState<number | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const { data } = await (supabase
                .from('subscription_plans') as any)
                .select('*')
                .eq('is_active', true)
                .order('price_usd', { ascending: true })

            if (data) {
                setPlans(data as unknown as SubscriptionPlan[])
            }
        } catch (error) {
            console.error('Fetch plans error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectPlan = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan)
        setCreditAmount(null)
    }

    const handleSelectCredits = (amount: number) => {
        setCreditAmount(amount)
        setSelectedPlan(null)
    }

    const handlePaymentSuccess = () => {
        setShowPayPal(false)
        setShowBankTransfer(false)
        alert('Payment successful! Your account will be activated shortly.')
        window.location.reload()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    const creditOptions = [
        { amount: 100, price: 1, popular: false },
        { amount: 500, price: 4.5, popular: true, save: 10 },
        { amount: 1000, price: 8, popular: false, save: 20 }
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                    Simple, <span className="text-primary-600">Transparent</span> Pricing
                </h1>
                <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                    Choose the plan that works best for you and take your digital presence to the next level.
                </p>
            </div>

            {/* Subscription Plans */}
            <div className="mb-20">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-primary-500 pl-4">Membership Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                    {plans.map((plan, index) => (
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            onSelect={handleSelectPlan}
                            popular={plan.name.includes('Annual')}
                        />
                    ))}
                </div>
            </div>

            {/* Card Credits */}
            <div className="mb-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-secondary-500 pl-4">Card Credits</h2>
                        <p className="mt-2 text-gray-600">
                            Send your profile cards to other users. Each send costs 1 credit.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {creditOptions.map(option => (
                        <Card
                            key={option.amount}
                            className={`p-6 flex flex-col ${option.popular ? 'border-2 border-secondary-500 shadow-lg' : ''}`}
                        >
                            {option.popular && (
                                <div className="bg-secondary-100 text-secondary-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit mb-4">
                                    Best Value
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {option.amount} Credits
                            </h3>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-gray-900">
                                        ${option.price}
                                    </span>
                                    {option.save && (
                                        <span className="text-green-600 font-bold ml-2">
                                            -{option.save}%
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">One-time purchase</p>
                            </div>

                            <ul className="space-y-3 mb-8 text-gray-600 flex-grow">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                                    Send {option.amount} profile cards
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                                    No expiration date
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                                    Track delivery status
                                </li>
                            </ul>

                            <Button
                                onClick={() => handleSelectCredits(option.amount)}
                                variant={option.popular ? 'primary' : 'outline'}
                                className="w-full"
                            >
                                Buy {option.amount} Credits
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Payment Method Selector Modal */}
            {(selectedPlan || creditAmount) && (
                <Modal
                    isOpen={true}
                    onClose={() => {
                        setSelectedPlan(null)
                        setCreditAmount(null)
                    }}
                    title="Choose Payment Method"
                    size="md"
                >
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-gray-600 mb-4">
                            You are purchasing: <span className="font-bold text-gray-900">
                                {selectedPlan ? selectedPlan.name : `${creditAmount} Card Credits`}
                            </span>
                        </p>

                        {/* Vietnam - Bank Transfer */}
                        <button
                            onClick={() => {
                                setShowBankTransfer(true)
                                // Don't reset selectedPlan/creditAmount here, we need them for the next modal
                            }}
                            className="w-full p-4 border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-left flex items-center gap-4 group"
                        >
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <Building className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Bank Transfer (Vietnam)</h3>
                                <p className="text-sm text-gray-500">Chuyển khoản nội địa • 24h approval</p>
                            </div>
                        </button>

                        {/* International - PayPal */}
                        <button
                            onClick={() => setShowPayPal(true)}
                            className="w-full p-4 border-2 border-gray-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-left flex items-center gap-4 group"
                        >
                            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">PayPal / Mastercard</h3>
                                <p className="text-sm text-gray-500">International • Instant activation</p>
                            </div>
                        </button>

                        {/* Crypto (Coming Soon) */}
                        <div className="w-full p-4 border-2 border-gray-50 rounded-xl opacity-60 flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-700">Crypto (USDT)</h3>
                                <p className="text-sm text-gray-500">Coming soon</p>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Bank Transfer Payment Flow */}
            {showBankTransfer && (
                <BankTransferModal
                    isOpen={showBankTransfer}
                    onClose={() => {
                        setShowBankTransfer(false)
                        setSelectedPlan(null)
                        setCreditAmount(null)
                    }}
                    plan={selectedPlan || undefined}
                    creditAmount={creditAmount || undefined}
                />
            )}

            {/* PayPal Payment Flow */}
            {showPayPal && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowPayPal(false)}
                    title="Complete Payment via PayPal"
                    size="md"
                >
                    <div className="space-y-6">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                            <h3 className="font-bold text-indigo-900 mb-1">Order Summary</h3>
                            {selectedPlan ? (
                                <div>
                                    <p className="text-3xl font-black text-indigo-900">${selectedPlan.price_usd}</p>
                                    <p className="text-indigo-700">{selectedPlan.name}</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-3xl font-black text-indigo-900">${(creditAmount! * 0.01).toFixed(2)}</p>
                                    <p className="text-indigo-700">{creditAmount} Card Credits</p>
                                </div>
                            )}
                        </div>

                        <PayPalButton
                            plan={selectedPlan || undefined}
                            creditAmount={creditAmount || undefined}
                            onSuccess={handlePaymentSuccess}
                            onError={(error) => alert('Payment failed: ' + error.message)}
                        />

                        <p className="text-xs text-center text-gray-500 px-4">
                            By completing this purchase, you agree to our Terms of Service and Privacy Policy. Click PayPal to pay with your account or debit/credit card.
                        </p>
                    </div>
                </Modal>
            )}

            {/* FAQ Section */}
            <div className="mt-24 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>
                <div className="space-y-6">
                    {[
                        {
                            q: "How long does bank transfer approval take?",
                            a: "Usually within 24 hours. We verify payments manually during business hours (9 AM - 6 PM GMT+7). If you're in a hurry, please use PayPal for instant activation."
                        },
                        {
                            q: "Can I get a refund?",
                            a: "Yes, within 7 days of purchase if you haven't used any features. Please contact our support team with your transaction ID."
                        },
                        {
                            q: "Do card credits expire?",
                            a: "No, card credits never expire. You can use them whenever you need to send your profile to a new contact."
                        }
                    ].map((faq, i) => (
                        <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                            <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
