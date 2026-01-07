
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Database service is temporarily unavailable' }, { status: 503 })
    }

    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify Admin status
    const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single() as any

    if (user?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { users, defaultPassword } = await request.json()

    if (!users || !Array.isArray(users) || !defaultPassword) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const results = []

    for (const userData of users) {
        const { email, username, full_name, bio } = userData

        try {
            // 1. Create Auth User (Admin API)
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: defaultPassword,
                email_confirm: true,
                user_metadata: { full_name, username }
            })

            if (authError) throw authError

            // 2. Create Public User Record
            // Note: Triggers might handle this, but let's be explicit to ensure data consistency
            const { error: publicUserError } = await supabaseAdmin
                .from('users')
                .upsert({
                    id: authUser.user.id,
                    email,
                    username,
                    full_name,
                    bio: bio || '',
                    role: 'user',
                    is_verified: false,
                    is_active: true
                } as any)

            if (publicUserError) throw publicUserError

            // 3. Create Profile Record
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    user_id: authUser.user.id,
                    display_name: full_name,
                    slug: username,
                    bio: bio || '',
                    is_public: true
                } as any)

            if (profileError) throw profileError

            results.push({ email, status: 'success' })
        } catch (error: any) {
            console.error(`Import failed for ${email}:`, error.message)
            results.push({ email, status: 'error', message: error.message })
        }
    }

    return NextResponse.json({ results })
}
