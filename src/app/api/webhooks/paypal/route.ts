import { NextResponse } from 'next/server'
import { verifyWebhook } from '@/lib/paypal/client'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const headers: Record<string, string> = {}
        request.headers.forEach((value, key) => {
            headers[key] = value
        })

        // Verify webhook signature
        const isValid = await verifyWebhook(headers, body)
        if (!isValid) {
            console.error('Invalid PayPal webhook signature')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const supabase = createServerClient()
        const eventType = body.event_type

        console.log(`Received PayPal webhook: ${eventType}`)

        // Handle Payment Capture Completed (One-time payments)
        if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            const capture = body.resource
            const orderId = capture.supplementary_data?.related_ids?.order_id || capture.parent_payment

            // Get transaction by provider_transaction_id (orderId)
            const { data: transaction } = await (supabase
                .from('payment_transactions') as any)
                .select('*')
                .eq('provider_transaction_id', orderId)
                .single()

            if (transaction && transaction.status !== 'completed') {
                // Update transaction
                await (supabase
                    .from('payment_transactions') as any)
                    .update({
                        status: 'completed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', transaction.id)

                // Process payment (Subscription or Credits)
                const metadata = transaction.metadata as any

                if (transaction.type === 'subscription') {
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

                        await (supabase
                            .from('users') as any)
                            .update({ is_verified: true, updated_at: new Date().toISOString() })
                            .eq('id', transaction.user_id)
                    }
                } else if (transaction.type === 'credits') {
                    await (supabase.from('card_credits') as any).insert({
                        user_id: transaction.user_id,
                        amount: metadata.creditAmount
                    })
                }
            }
        }

        // Handle Billing Subscription Activated (Recurring)
        if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
            const subscription = body.resource
            const customId = subscription.custom_id // We should ensure custom_id is passed during subscription creation

            if (customId) {
                const { userId, planId } = JSON.parse(customId)

                // Update or create subscription in DB
                // ... implementation for recurring subs if needed in future
            }
        }

        return NextResponse.json({ received: true })
    } catch (error: any) {
        console.error('PayPal webhook error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
