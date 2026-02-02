import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { vi } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    // 1. Security Check
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const supabase = createClient()

    // 2. Define Time Range (Last Month)
    const now = new Date()
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))
    const monthKey = format(lastMonthStart, 'yyyy-MM') // e.g., "2023-10"

    console.log(`[ROI Cron] Starting ROI email job for ${monthKey}`)

    // 3. Get All Active Businesses/Profiles
    // We want profiles that have at least one active offer or request in the period, OR just all verified profiles?
    // Let's target all profiles associated with a user to encourage them.
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
            id, 
            user_id, 
            full_name, 
            type,
            user:users!profiles_user_id_fkey(email)
        `)
        .not('user', 'is', null) // Ensure user exists

    if (profilesError) {
        console.error('[ROI Cron] Error fetching profiles:', profilesError)
        return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    let emailsSent = 0
    let errors = 0

    // 4. Loop & Process
    for (const profile of profiles || []) {
        try {
            // Idempotency Check: Has email been sent for this User + Month?
            // implemented via `analytics` table: event_name = 'monthly_roi_email', metadata -> { month: '2023-10' }
            const { data: existingLog } = await supabase
                .from('analytics')
                .select('id')
                .eq('user_id', profile.user_id)
                .eq('event_name', 'monthly_roi_email')
                .contains('metadata', { month: monthKey })
                .single()

            if (existingLog) {
                continue // Already sent
            }

            // Metrics Calculation for Last Month

            // A. Service Requests Created
            const { count: requestsCount } = await supabase
                .from('service_requests')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.user_id)
                .gte('created_at', lastMonthStart.toISOString())
                .lte('created_at', lastMonthEnd.toISOString())

            // B. Offers Sent
            const { count: offersSentCount } = await supabase
                .from('service_offers')
                .select('*', { count: 'exact', head: true })
                .eq('profile_id', profile.id)
                .gte('created_at', lastMonthStart.toISOString())
                .lte('created_at', lastMonthEnd.toISOString())

            // C. Requests Closed (Success) - approximated by offers accepted? 
            // Or requests user created that were closed? Let's do Offers Accepted (Revenue proxy)
            const { count: offersAcceptedCount } = await supabase
                .from('service_offers')
                .select('*', { count: 'exact', head: true })
                .eq('profile_id', profile.id)
                .eq('status', 'accepted')
                .gte('updated_at', lastMonthStart.toISOString())
                .lte('updated_at', lastMonthEnd.toISOString())

            // Skip if no activity? Or send "Here is what happened" even if 0?
            // Strategy: Send only if there was SOME activity to keep them engaged, OR send empty to re-engage?
            // Let's send to everyone for now (Re-engagement).

            const emailSubject = `Báo cáo hiệu quả tháng ${format(lastMonthStart, 'M/yyyy')} của bạn trên SocialHub`

            const emailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #4F46E5;">Báo cáo tháng ${format(lastMonthStart, 'M/yyyy')}</h1>
                    <p>Xin chào ${profile.full_name || 'bạn'},</p>
                    <p>Dưới đây là tổng hợp hoạt động của bạn trên SocialHub trong tháng vừa qua:</p>
                    
                    <div style="display: flex; gap: 20px; margin: 20px 0;">
                        <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; flex: 1; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #111827;">${requestsCount || 0}</div>
                            <div style="font-size: 14px; color: #6B7280;">Yêu cầu đã tạo</div>
                        </div>
                        <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; flex: 1; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #111827;">${offersSentCount || 0}</div>
                            <div style="font-size: 14px; color: #6B7280;">Báo giá đã gửi</div>
                        </div>
                        <div style="background: #ECFDF5; padding: 15px; border-radius: 8px; flex: 1; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #059669;">${offersAcceptedCount || 0}</div>
                            <div style="font-size: 14px; color: #059669;">Chốt đơn thành công</div>
                        </div>
                    </div>

                    <p>Hãy truy cập SocialHub để tìm kiếm thêm cơ hội mới ngay hôm nay!</p>
                    <a href="https://socialhub.vn/dashboard" style="display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đến Dashboard</a>
                </div>
            `

            // Send Email
            if ((profile.user as any)?.email) {
                await sendEmail({
                    to: (profile.user as any).email,
                    subject: emailSubject,
                    html: emailHtml
                })

                // Log Analytics
                await supabase.from('analytics').insert({
                    user_id: profile.user_id,
                    event_name: 'monthly_roi_email',
                    metadata: { month: monthKey, sent_at: new Date().toISOString() }
                })

                emailsSent++
            }

        } catch (err) {
            console.error(`[ROI Cron] Failed for user ${profile.id}`, err)
            errors++
        }
    }

    return NextResponse.json({
        success: true,
        month: monthKey,
        processed: profiles?.length || 0,
        sent: emailsSent,
        errors
    })
}
