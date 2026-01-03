// ============================================
// src/app/[username]/page.tsx
// ============================================

import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicProfileView } from '@/components/profile/PublicProfileView'
import type { Metadata } from 'next'

interface PageProps {
  params: {
    username: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createServerClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      user:users(*)
    `)
    .eq('slug', params.username)
    .eq('is_public', true)
    .single()

  if (!profile) {
    return {
      title: 'Profile Not Found - Social Hub',
    }
  }

  return {
    title: `${profile.display_name} (@${profile.user.username}) - Social Hub`,
    description: profile.user.bio || `Check out ${profile.display_name}'s social profiles`,
    openGraph: {
      title: profile.display_name,
      description: profile.user.bio || '',
      images: profile.user.avatar_url ? [profile.user.avatar_url] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: profile.display_name,
      description: profile.user.bio || '',
      images: profile.user.avatar_url ? [profile.user.avatar_url] : [],
    },
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const supabase = createServerClient()

  // Fetch profile with all relations
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user:users(*),
      social_accounts(*)
    `)
    .eq('slug', params.username)
    .eq('is_public', true)
    .single()

  if (error || !profile) {
    notFound()
  }

  // Sort social accounts
  if (profile.social_accounts) {
    profile.social_accounts.sort((a, b) => a.display_order - b.display_order)
  }

  // Track view (server-side)
  await supabase.rpc('increment_profile_views', { profile_id: profile.id })

  return <PublicProfileView profile={profile} />
}

// ============================================
// src/components/profile/PublicProfileView.tsx
// ============================================

'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatNumber } from '@/lib/utils/formatting'
import { SOCIAL_PLATFORMS } from '@/lib/utils/constants'
import { 
  Heart,
  MapPin,
  Link2,
  Globe,
  CheckCircle,
  Share2,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'
import type { Profile } from '@/types/user.types'

interface PublicProfileViewProps {
  profile: Profile
}

export function PublicProfileView({ profile }: PublicProfileViewProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const isOwnProfile = user?.id === profile.user_id
  const visibleAccounts = profile.social_accounts?.filter(acc => acc.is_visible) || []

  const handleFollow = async () => {
    if (!user || isOwnProfile) return

    setIsLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.user_id)
        
        // Track unfollow event
        await supabase.from('analytics').insert({
          profile_id: profile.id,
          event_type: 'follow',
          metadata: { action: 'unfollow' }
        })
        
        setIsFollowing(false)
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profile.user_id,
          })
        
        // Track follow event
        await supabase.from('analytics').insert({
          profile_id: profile.id,
          event_type: 'follow',
          metadata: { action: 'follow' }
        })
        
        setIsFollowing(true)
      }
    } catch (error) {
      console.error('Follow error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.display_name} - Social Hub`,
          text: profile.user?.bio || `Check out ${profile.display_name}'s profile`,
          url: url,
        })
        
        // Track share event
        await supabase.from('analytics').insert({
          profile_id: profile.id,
          event_type: 'share',
          metadata: { method: 'native_share' }
        })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        
        // Track share event
        await supabase.from('analytics').insert({
          profile_id: profile.id,
          event_type: 'share',
          metadata: { method: 'copy_link' }
        })
      }
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handleSocialClick = async (accountId: string, url: string) => {
    // Track click event
    try {
      await supabase.from('analytics').insert({
        profile_id: profile.id,
        event_type: 'click',
        social_account_id: accountId,
      })

      // Increment click count
      await supabase.rpc('increment_social_click', { account_id: accountId })
    } catch (error) {
      console.error('Track click error:', error)
    }

    // Open link
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/hub" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="font-semibold">Social Hub</span>
            </a>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share
                  </>
                )}
              </Button>

              {!isOwnProfile && user && (
                <Button
                  size="sm"
                  variant={isFollowing ? 'outline' : 'primary'}
                  onClick={handleFollow}
                  isLoading={isLoading}
                >
                  {isFollowing ? (
                    <>
                      <Heart className="w-4 h-4 fill-current" />
                      Following
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}

              {isOwnProfile && (
                <a href="/profile">
                  <Button size="sm" variant="primary">
                    Edit Profile
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Card className="mb-6">
          {/* Cover Image */}
          {profile.cover_image_url ? (
            <div className="h-64 bg-gradient-to-r from-primary-400 to-secondary-400">
              <img 
                src={profile.cover_image_url} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-r from-primary-400 to-secondary-400" />
          )}

          <div className="p-8">
            {/* Avatar */}
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-24 mb-6">
              {profile.user?.avatar_url ? (
                <img
                  src={profile.user.avatar_url}
                  alt={profile.display_name}
                  className="w-40 h-40 rounded-full border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">
                    {profile.display_name.charAt(0)}
                  </span>
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900">
                    {profile.display_name}
                  </h1>
                  {profile.user?.is_verified && (
                    <CheckCircle className="w-8 h-8 text-primary-600 fill-current" />
                  )}
                </div>
                <p className="text-xl text-gray-600 mb-4">@{profile.user?.username}</p>
              </div>
            </div>

            {/* Bio */}
            {profile.user?.bio && (
              <p className="text-lg text-gray-700 mb-6 max-w-3xl">
                {profile.user.bio}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-6 text-gray-600 mb-6">
              {profile.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <Link2 className="w-5 h-5" />
                  <span>{new URL(profile.website).hostname}</span>
                </a>
              )}
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span>{formatNumber(profile.view_count)} views</span>
              </div>
            </div>

            {/* Tags */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {profile.tags.map((tag, index) => (
                  <Badge key={index} variant="info" className="text-base px-4 py-1">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-8 pt-6 border-t border-gray-200">
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  {formatNumber(profile.follower_count)}
                </span>
                <span className="text-gray-600 ml-2">Followers</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  {formatNumber(profile.following_count)}
                </span>
                <span className="text-gray-600 ml-2">Following</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  {formatNumber(visibleAccounts.length)}
                </span>
                <span className="text-gray-600 ml-2">Accounts</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Social Accounts */}
        {visibleAccounts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Social Accounts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleAccounts.map((account) => {
                const platform = SOCIAL_PLATFORMS.find(
                  p => p.name === account.platform
                )
                
                return (
                  <Card
                    key={account.id}
                    hover
                    className="p-6 cursor-pointer transition-all hover:scale-[1.02]"
                    onClick={() => handleSocialClick(account.id, account.platform_url)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: platform?.color || '#6B7280' }}
                      >
                        <span className="text-2xl font-bold">
                          {account.platform.charAt(0)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {account.platform}
                        </h3>
                        <p className="text-gray-600 truncate">
                          @{account.platform_username}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatNumber(account.click_count)} clicks
                        </p>
                      </div>

                      <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-primary-600 flex-shrink-0" />
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {visibleAccounts.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Globe className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No social accounts yet
            </h3>
            <p className="text-gray-600">
              {isOwnProfile 
                ? "Add your first social media account to get started"
                : "This user hasn't added any social accounts yet"}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

// ============================================
// Add SQL function for incrementing views
// Run this in Supabase SQL Editor
// ============================================

/*
CREATE OR REPLACE FUNCTION increment_profile_views(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET view_count = view_count + 1
  WHERE id = profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_social_click(account_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE social_accounts
  SET click_count = click_count + 1
  WHERE id = account_id;
END;
$$;
*/