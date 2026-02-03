import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'

export async function POST(request: Request) {
  try {
    const { senderId, receiverId } = await request.json()
    const supabase = createServerClient()

    // Get sender info
    const { data: sender } = await supabase
      .from('users')
      .select('full_name, username')
      .eq('id', senderId)
      .single()

    // Get receiver info
    const { data: receiver } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', receiverId)
      .single()

    // Get sender profile for link
    const { data: profile } = await supabase
      .from('profiles')
      .select('slug, display_name')
      .eq('user_id', senderId)
      .single()

    if (sender && receiver && profile) {
      const p = profile as any
      const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${p.slug}`

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
          <h2 style="color: #4f46e5; margin-bottom: 16px;">New Profile Card Received! 🚀</h2>
          <p style="font-size: 16px; color: #374151; line-height: 1.5;">
            <strong>${(sender as any).full_name}</strong> (@${(sender as any).username}) just sent you their digital profile card on <strong>Social HUB</strong>.
          </p>
          <p style="font-size: 16px; color: #374151; line-height: 1.5;">
            Connect with them to see all their social accounts and links in one place.
          </p>
          <div style="margin-top: 24px;">
            <a href="${profileUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              View ${p.display_name}'s Profile
            </a>
          </div>
          <hr style="margin-top: 32px; border: 0; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 12px; color: #6b7280; margin-top: 16px;">
            You received this because someone shared their profile with you on Social HUB. 
            Manage your cards in your dashboard.
          </p>
        </div>
      `

      await sendEmail({
        to: (receiver as any).email,
        subject: `${(sender as any).full_name} sent you their profile card! 🎉`,
        html: html
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
