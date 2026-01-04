import { NextResponse } from 'next/server'
import client from '@/lib/paypal/client'
import checkoutNodeJssdk from '@paypal/checkout-server-sdk'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const { orderId } = await request.json()
        const supabase = createServerClient()

        // Capture PayPal order
        const captureRequest = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId)
        captureRequest.requestBody({} as any)

        const capture = await client().execute(captureRequest)

        if (capture.result.status !== 'COMPLETED') {
            throw new Error('Payment not completed')
        }

        // Get transaction
        const { data: transaction, error: transError } = await (supabase
            .from('payment_transactions') as any)
            .select('*')
            .eq('provider_transaction_id', orderId)
            .single()

        if (transError || !transaction) {
            throw new Error('Transaction not found')
        }

        if (transaction.status === 'completed') {
            return NextResponse.json({ success: true, capture: capture.result })
        }

        // Update transaction
        await (supabase
            .from('payment_transactions') as any)
            .update({
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('id', transaction.id)

        // Process payment
        const metadata = transaction.metadata as any

        if (transaction.type === 'subscription') {
            // Activate subscription
            const { data: plan } = await (supabase
                .from('subscription_plans') as any)
                .select('*')
                .eq('id', metadata.planId)
                .single()

            if (plan) {
                const now = new Date()
                const expiresAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000)

                await (supabase.from('user_subscriptions') as any).insert({
                    user_id: transaction.user_id,
                    plan_id: plan.id,
                    status: 'active',
                    starts_at: now.toISOString(),
                    expires_at: expiresAt.toISOString(),
                    payment_method: 'paypal',
                    payment_provider: 'paypal'
                })

                // Give verification badge
                await (supabase
                    .from('users') as any)
                    .update({ is_verified: true, updated_at: new Date().toISOString() })
                    .eq('id', transaction.user_id)
            }
        } else if (transaction.type === 'credits') {
            // Add card credits
            await (supabase.from('card_credits') as any).insert({
                user_id: transaction.user_id,
                amount: metadata.creditAmount
            })
        }

        return NextResponse.json({ success: true, capture: capture.result })
    } catch (error: any) {
        console.error('PayPal capture error:', error)
        return NextResponse.json({ error: error.message || 'Failed to capture payment' }, { status: 500 })
    }
}
