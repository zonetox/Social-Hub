import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { userId } = await req.json()

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Initialize Supabase Client with Service Role Key (Bypasses RLS)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        console.log(`[Self-Healing] Triggered sync for user: ${userId}`)

        // 1. Get user data from Auth
        const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

        if (authError || !user) {
            console.error('[Self-Healing] Auth user not found:', authError?.message)
            return NextResponse.json({ error: 'Auth user not found' }, { status: 404 })
        }

        // 2. Prepare data
        const usernameBase = (user.email || 'user').split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        const finalUsername = `${usernameBase}-${user.id.substring(0, 4)}`

        // 3. Sync public.users
        const { error: userError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: user.id,
                email: user.email!,
                username: user.user_metadata?.username || finalUsername,
                full_name: user.user_metadata?.full_name || user.email || 'User',
                role: user.user_metadata?.role || 'user',
                is_active: true
            })

        if (userError) {
            console.error('[Self-Healing] Failed to sync public.users:', userError.message)
            throw userError
        }

        // 4. Sync public.profiles
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                user_id: user.id,
                display_name: user.user_metadata?.full_name || user.email || 'User',
                slug: user.user_metadata?.username || finalUsername,
                is_public: true
            })

        if (profileError) {
            console.error('[Self-Healing] Failed to sync public.profiles:', profileError.message)
            throw profileError
        }

        console.log(`[Self-Healing] Successfully repaired records for: ${userId}`)
        return NextResponse.json({ success: true, message: 'Profile repaired successfully' })

    } catch (error: any) {
        console.error('[Self-Healing] Fatal error during sync:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
