/**
 * Mock email utility. 
 * Replace this with a real provider like Resend, SendGrid, or AWS SES.
 */

export async function sendEmail(to: string, subject: string, html: string) {
    console.log('--- SENDING EMAIL ---')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('Content:', html)
    console.log('--- EMAIL SENT ---')

    // Simulation of async network delay
    return new Promise((resolve) => setTimeout(resolve, 500))
}
