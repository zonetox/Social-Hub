import { Resend } from 'resend'

const getResendClient = () => {
    if (!process.env.RESEND_API_KEY) return null;
    return new Resend(process.env.RESEND_API_KEY);
};

interface SendEmailOptions {
    to: string
    subject: string
    html: string
    text?: string
}

/**
 * Sends an email using Resend.
 * Fallbacks to console log if API key is missing for development.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
    const resend = getResendClient();
    const from = process.env.NEXT_PUBLIC_EMAIL_FROM || 'Social HUB <noreply@social-hub.com>';

    if (!resend) {
        console.log('--- EMAIL MOCK MODE ---')
        console.log(`From: ${from}`)
        console.log(`To: ${to}`)
        console.log(`Subject: ${subject}`)
        console.log('--- END MOCK ---')
        return { success: true, message: 'Mock sent' }
    }

    try {
        const { data, error } = await resend.emails.send({
            from: from,
            to: [to],
            subject: subject,
            html: html,
            text: text || html.replace(/<[^>]*>?/gm, ''), // Simple text fallback
        })

        if (error) {
            console.error('Resend error:', error)
            throw error
        }

        return { success: true, data }
    } catch (error) {
        console.error('Email send failed:', error)
        throw error
    }
}
