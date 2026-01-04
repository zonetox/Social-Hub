import { NextResponse } from 'next/server'
import client from '@/lib/paypal/client'
import checkoutNodeJssdk from '@paypal/checkout-server-sdk'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const { planId, creditAmount } = await request.json()
        const supabase = createServerClient()

        // Get user session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let amount = 0
        let description = ''

        if (planId) {
            // Subscription plan
            const { data: plan, error: planError } = await (supabase
                .from('subscription_plans') as any)
                .select('*')
                .eq('id', planId)
                .single()

            if (planError || !plan) {
                return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
            }

            amount = plan.price_usd
            description = `Social Hub - ${plan.name}`
        } else if (creditAmount) {
            // Card credits
            amount = creditAmount * 0.01 // $0.01 per credit
            description = `Social Hub - ${creditAmount} Card Credits`
        } else {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        // Create PayPal order
        const paypalRequest = new checkoutNodeJssdk.orders.OrdersCreateRequest()
        paypalRequest.prefer('return=representation')
        paypalRequest.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: amount.toFixed(2)
                },
                description: description,
                custom_id: JSON.stringify({
                    userId: session.user.id,
                    planId,
                    creditAmount
                })
            }],
            application_context: {
                brand_name: 'Social Hub',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`, // Redirect to upgrade page for now
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`
            }
        } as any)

        const order = await client().execute(paypalRequest)

        // Save pending transaction
        await (supabase.from('payment_transactions') as any).insert({
            user_id: session.user.id,
            type: planId ? 'subscription' : 'credits',
            amount_usd: amount,
            currency: 'USD',
            payment_method: 'paypal',
            payment_provider: 'paypal',
            status: 'pending',
            provider_transaction_id: order.result.id,
            metadata: { planId, creditAmount }
        })

        return NextResponse.json({ orderId: order.result.id })
    } catch (error) {
        console.error('PayPal create order error:', error)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
}
