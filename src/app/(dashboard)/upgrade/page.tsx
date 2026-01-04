'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PricingCard } from '@/components/payment/PricingCard'
import { BankTransferModal } from '@/components/payment/BankTransferModal'
import type { SubscriptionPlan } from '@/types/payment.types'
import { Sparkles, Shield, Zap, BarChart3 } from 'lucide-react'

export default function UpgradePage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('is_active', true)
                .order('price_usd', { ascending: true })

            if (data) {
                setPlans(data as unknown as SubscriptionPlan[])
            }
        } catch (error) {
            console.error('Error fetching plans:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectPlan = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan)
        setIsModalOpen(true)
    }

    const features = [
        {
            icon: <Zap className="w-6 h-6 text-yellow-500" />,
            title: 'Unlimited Cards',
            description: 'Create and manage as many digital business cards as you need.'
        },
        {
            icon: <Shield className="w-6 h-6 text-blue-500" />,
            title: 'Verification Badge',
            description: 'Get a blue checkmark on your profile to build trust with your audience.'
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-purple-500" />,
            title: 'Advanced Analytics',
            description: 'Track views, clicks, and engagement across all your cards.'
        },
        {
            icon: <Sparkles className="w-6 h-6 text-pink-500" />,
            title: 'Full Customization',
            description: 'Unlock premium themes, custom colors, and advanced layout options.'
        }
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                    Upgrade Your <span className="text-primary-600">Experience</span>
                </h1>
                <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                    Choose the plan that's right for you and unlock the full potential of your professional digital presence.
                </p>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
                {plans.map((plan) => (
                    <PricingCard
                        key={plan.id}
                        plan={plan}
                        onSelect={handleSelectPlan}
                        popular={plan.name.includes('Annual')}
                    />
                ))}
            </div>

            {/* Feature Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900">Why Go Premium?</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-8">
                    {features.map((feature, index) => (
                        <div key={index} className="flex gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ or Footer Info */}
            <div className="mt-16 text-center text-gray-500 text-sm">
                <p>All payments are processed securely. Subscriptions can be cancelled at any time.</p>
                <p className="mt-2">Need a custom plan for your team? <a href="mailto:support@socialhub.com" className="text-primary-600 hover:underline">Contact us</a></p>
            </div>

            {/* Payment Modal */}
            {selectedPlan && (
                <BankTransferModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    plan={selectedPlan}
                />
            )}
        </div>
    )
}
