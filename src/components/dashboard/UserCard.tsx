// @ts-nocheck
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatNumber } from '@/lib/utils/formatting'
import { SOCIAL_PLATFORMS } from '@/lib/utils/constants'
import {
    Users,
    Globe,
    ExternalLink,
    Heart,
    MapPin,
    Link2,
    CheckCircle
} from 'lucide-react'
import type { Profile } from '@/types/user.types'

interface UserCardProps {
    profile: Profile
    onFollowChange?: () => void
}

export function UserCard({ profile, onFollowChange }: UserCardProps) {
    const { user } = useAuth()
    const [isFollowing, setIsFollowing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
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

                setIsFollowing(false)
            } else {
                await supabase
                    .from('follows')
                    .insert({
                        follower_id: user.id,
                        following_id: profile.user_id,
                    } as any)

                setIsFollowing(true)
            }

            onFollowChange?.()
        } catch (error) {
            console.error('Follow error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card hover className="overflow-hidden">
            {/* Cover Image */}
            {profile.cover_image_url && (
                <div className="h-32 bg-gradient-to-r from-primary-400 to-secondary-400">
                    <img
                        src={profile.cover_image_url}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            {!profile.cover_image_url && (
                <div className="h-32 bg-gradient-to-r from-primary-400 to-secondary-400" />
            )}

            <div className="p-6">
                {/* Avatar & Name */}
                <div className="flex items-start justify-between -mt-16 mb-4">
                    <div className="flex items-end gap-3">
                        {profile.user?.avatar_url ? (
                            <img
                                src={profile.user.avatar_url}
                                alt={profile.display_name}
                                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                    {profile.display_name.charAt(0)}
                                </span>
                            </div>
                        )}
                    </div>

                    {!isOwnProfile && user && (
                        <Button
                            size="sm"
                            variant={isFollowing ? 'outline' : 'primary'}
                            onClick={handleFollow}
                            isLoading={isLoading}
                            className="mt-12"
                        >
                            {isFollowing ? (
                                <>
                                    <Heart className="w-4 h-4 fill-current" />
                                    Following
                                </>
                            ) : (
                                'Follow'
                            )}
                        </Button>
                    )}
                </div>

                {/* User Info */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-900">
                            {profile.display_name}
                        </h3>
                        {profile.user?.is_verified && (
                            <CheckCircle className="w-5 h-5 text-primary-600 fill-current" />
                        )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                        @{profile.user?.username}
                    </p>

                    {profile.user?.bio && (
                        <p className="text-gray-700 mb-3">{profile.user.bio}</p>
                    )}

                    {/* Location & Website */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        {profile.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {profile.location}
                            </div>
                        )}
                        {profile.website && (
                            <a
                                href={profile.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                            >
                                <Link2 className="w-4 h-4" />
                                Website
                            </a>
                        )}
                    </div>

                    {/* Tags */}
                    {profile.tags && profile.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {profile.tags.map((tag, index) => (
                                <Badge key={index} variant="info">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="flex gap-6 mb-4 pb-4 border-b border-gray-200">
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                            {formatNumber(profile.follower_count)}
                        </p>
                        <p className="text-xs text-gray-600">Followers</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                            {formatNumber(profile.following_count)}
                        </p>
                        <p className="text-xs text-gray-600">Following</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                            {formatNumber(visibleAccounts.length)}
                        </p>
                        <p className="text-xs text-gray-600">Accounts</p>
                    </div>
                </div>

                {/* Social Accounts */}
                {visibleAccounts.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Social Accounts
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {visibleAccounts.slice(0, 6).map((account) => {
                                const platform = SOCIAL_PLATFORMS.find(
                                    p => p.name === account.platform
                                )
                                return (
                                    <a
                                        key={account.id}
                                        href={account.platform_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                                            style={{ backgroundColor: platform?.color }}
                                        >
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500 truncate">
                                                {account.platform}
                                            </p>
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {account.platform_username}
                                            </p>
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-primary-600" />
                                    </a>
                                )
                            })}
                        </div>

                        {visibleAccounts.length > 6 && (
                            <Link
                                href={`/${profile.slug}`}
                                className="block text-center mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                View all {visibleAccounts.length} accounts →
                            </Link>
                        )}
                    </div>
                )}

                {/* View Profile Button */}
                <Link href={`/${profile.slug}`} className="block mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                        View Full Profile
                    </Button>
                </Link>
            </div>
        </Card>
    )
}
