import { Resend } from 'resend'

const getResendClient = () => {
    if (!process.env.RESEND_API_KEY) return null;
    return new Resend(process.env.RESEND_API_KEY);
};

/**
 * Sends an email using Resend.
 * Fallbacks to console log if API key is missing for development.
 */
export async function sendEmail(to: string, subject: string, html: string) {
    const resend = getResendClient();

    if (!resend) {
        console.log('--- RESEND_API_KEY MISSING (MOCK MODE) ---')
        console.log(`To: ${to}`)
        console.log(`Subject: ${subject}`)
        console.log('--- END MOCK ---')
        return { success: true, message: 'Mock sent' }
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Social HUB <noreply@social-hub.com>', // Replace with your verified domain later
            to: [to],
            subject: subject,
            html: html,
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
