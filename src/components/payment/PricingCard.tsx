'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Check } from 'lucide-react'
import type { SubscriptionPlan } from '@/types/payment.types'

interface PricingCardProps {
    plan: SubscriptionPlan
    onSelect: (plan: SubscriptionPlan) => void
    popular?: boolean
}

export function PricingCard({ plan, onSelect, popular }: PricingCardProps) {
    const features = [
        { key: 'unlimited_cards', label: 'Unlimited Cards' },
        { key: 'qr_codes', label: 'QR Code Generation' },
        { key: 'analytics', label: 'Profile Analytics' },
        { key: 'verification_badge', label: 'Verification Badge' },
    ]

    return (
        <Card className={`p-6 ${popular ? 'border-2 border-primary-500 shadow-lg' : ''}`}>
            {popular && (
                <Badge variant="info" className="mb-4">Most Popular</Badge>
            )}

            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>

            <div className="mb-6">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                        ${plan.price_usd}
                    </span>
                    <span className="text-gray-600">
                        /{plan.duration_days === 365 ? 'year' : plan.duration_days === 36500 ? 'lifetime' : 'days'}
                    </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                    ≈ {plan.price_vnd?.toLocaleString('vi-VN')} VNĐ
                </p>
            </div>

            <ul className="space-y-3 mb-6">
                {features.map(feature => (
                    <li key={feature.key} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">{feature.label}</span>
                    </li>
                ))}
            </ul>

            <Button
                onClick={() => onSelect(plan)}
                variant={popular ? 'primary' : 'outline'}
                className="w-full"
            >
                Choose Plan
            </Button>
        </Card>
    )
}
