import checkoutNodeJssdk from '@paypal/checkout-server-sdk'

function environment() {
    const clientId = process.env.PAYPAL_CLIENT_ID!
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET!

    if (process.env.NODE_ENV === 'production') {
        return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
    } else {
        return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret)
    }
}

export function client() {
    return new checkoutNodeJssdk.core.PayPalHttpClient(environment())
}

export async function getAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID!
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET!
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const url = process.env.NODE_ENV === 'production'
        ? 'https://api-m.paypal.com/v1/oauth2/token'
        : 'https://api-m.sandbox.paypal.com/v1/oauth2/token'

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
        },
        body: 'grant_type=client_credentials',
    })

    const data = await response.json()
    return data.access_token
}

export async function verifyWebhook(
    headers: Record<string, string>,
    body: any
) {
    const accessToken = await getAccessToken()
    const url = process.env.NODE_ENV === 'production'
        ? 'https://api-m.paypal.com/v1/notifications/verify-webhook-signature'
        : 'https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature'

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            auth_algo: headers['paypal-auth-algo'],
            cert_url: headers['paypal-cert-url'],
            transmission_id: headers['paypal-transmission-id'],
            transmission_sig: headers['paypal-transmission-sig'],
            transmission_time: headers['paypal-transmission-time'],
            webhook_id: process.env.PAYPAL_WEBHOOK_ID,
            webhook_event: body,
        }),
    })

    const verification = await response.json()
    return verification.verification_status === 'SUCCESS'
}

export default client
