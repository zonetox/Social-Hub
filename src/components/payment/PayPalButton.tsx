'use client'

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import type { SubscriptionPlan } from '@/types/payment.types'

interface PayPalButtonProps {
    plan?: SubscriptionPlan
    creditAmount?: number
    onSuccess: () => void
    onError: (error: any) => void
}

export function PayPalButton({ plan, creditAmount, onSuccess, onError }: PayPalButtonProps) {
    const createOrder = async () => {
        try {
            const response = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan?.id,
                    creditAmount
                })
            })

            const data = await response.json()
            if (data.error) throw new Error(data.error)
            return data.orderId
        } catch (error) {
            console.error('Create order error:', error)
            throw error
        }
    }

    const onApprove = async (data: any) => {
        try {
            const response = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderID })
            })

            const result = await response.json()

            if (result.success) {
                onSuccess()
            } else {
                throw new Error(result.error || 'Payment failed')
            }
        } catch (error: any) {
            console.error('Capture error:', error)
            onError(error)
        }
    }

    return (
        <PayPalScriptProvider
            options={{
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                currency: 'USD'
            }}
        >
            <div className="min-h-[150px]">
                <PayPalButtons
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                    style={{
                        layout: 'vertical',
                        color: 'blue',
                        shape: 'rect',
                        label: 'paypal'
                    }}
                />
            </div>
        </PayPalScriptProvider>
    )
}
