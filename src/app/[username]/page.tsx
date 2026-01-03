
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicProfileView } from '@/components/profile/PublicProfileView'
import type { Metadata } from 'next'
import type { Profile } from '@/types/user.types'

interface PageProps {
    params: {
        username: string
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const supabase = createServerClient()

    const { data: profileData } = await supabase
        .from('profiles')
        .select(`
      *,
      user:users(*)
    `)
        .eq('slug', params.username)
        .eq('is_public', true)
        .single() as any

    const profile = profileData as any as Profile | null

    if (!profile) {
        return {
            title: 'Profile Not Found - Social Hub',
        }
    }

    return {
        title: `${profile.display_name} (@${profile.user?.username || 'user'}) - Social Hub`,
        description: profile.user?.bio || `Check out ${profile.display_name}'s social profiles`,
        openGraph: {
            title: profile.display_name,
            description: profile.user?.bio || '',
            images: profile.user?.avatar_url ? [profile.user.avatar_url] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: profile.display_name,
            description: profile.user?.bio || '',
            images: profile.user?.avatar_url ? [profile.user.avatar_url] : [],
        },
    }
}

export default async function PublicProfilePage({ params }: PageProps) {
    const supabase = createServerClient()

    // Fetch profile with all relations
    const { data: profileData, error } = await supabase
        .from('profiles')
        .select(`
      *,
      user:users(*),
      social_accounts(*)
    `)
        .eq('slug', params.username)
        .eq('is_public', true)
        .single() as any

    const profile = profileData as any as Profile | null

    if (error || !profile) {
        notFound()
    }

    // Sort social accounts
    if (profile.social_accounts) {
        profile.social_accounts.sort((a, b) => a.display_order - b.display_order)
    }

    // Track view (server-side)
    // @ts-ignore
    await supabase.rpc('increment_profile_views', { profile_id: profile.id })

    return <PublicProfileView profile={profile} />
}
