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
    CheckCircle,
    UserPlus,
    Plus,
    Activity
} from 'lucide-react'
import type { Profile } from '@/types/user.types'
import { clsx } from 'clsx'
import { SendCardButton } from '@/components/card/SendCardButton'
import { DynamicIcon } from '@/components/shared/DynamicIcon'
import Image from 'next/image'

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
        <Card variant="glass" hover className="overflow-hidden group">
            {/* Cover Image with Overlay */}
            <div className="relative h-32 overflow-hidden">
                {profile.cover_image_url ? (
                    <Image
                        src={profile.cover_image_url}
                        alt="Cover"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full premium-gradient" />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                {/* Followers Quick Badge */}
                <div className="absolute top-3 right-3">
                    <Badge variant="glass-dark" className="backdrop-blur-xl border-white/30 text-white">
                        <Users className="w-3 h-3 mr-1" />
                        {formatNumber(profile.follower_count)}
                    </Badge>
                </div>
            </div>

            <div className="p-6 relative">
                {/* Avatar & Name Section */}
                <div className="flex items-start justify-between -mt-14 mb-4 relative z-10">
                    <div className="flex items-end gap-3">
                        <div className="relative group/avatar">
                            {profile.user?.avatar_url ? (
                                <div className="w-20 h-20 relative rounded-2xl border-4 border-white shadow-2xl transition-transform group-hover/avatar:scale-105 overflow-hidden">
                                    <Image
                                        src={profile.user.avatar_url}
                                        alt={profile.display_name}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-2xl premium-gradient flex items-center justify-center">
                                    <span className="text-3xl font-bold text-white">
                                        {profile.display_name.charAt(0)}
                                    </span>
                                </div>
                            )}
                            {profile.user?.is_verified && (
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                                    <CheckCircle className="w-5 h-5 text-primary-600 fill-current" />
                                </div>
                            )}
                        </div>
                    </div>

                    {!isOwnProfile && user && (
                        <Button
                            size="sm"
                            variant={isFollowing ? 'outline' : 'primary'}
                            onClick={handleFollow}
                            isLoading={isLoading}
                            className={clsx(
                                "mt-10 rounded-xl transition-all",
                                !isFollowing && "premium-gradient border-none shadow-lg hover:shadow-primary-200"
                            )}
                        >
                            {isFollowing ? (
                                <>
                                    <Heart className="w-4 h-4 fill-current mr-2" />
                                    Following
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Follow
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Info & Stats */}
                <div className="space-y-3">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight">
                            {profile.display_name}
                        </h3>
                        <p className="text-sm font-medium text-primary-600">
                            @{profile.user?.username}
                        </p>
                    </div>

                    {profile.user?.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2 italic">
                            "{profile.user.bio}"
                        </p>
                    )}

                    {/* Meta Data */}
                    <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-500">
                        {profile.location && (
                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                                <MapPin className="w-3 h-3" />
                                {profile.location}
                            </div>
                        )}
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            <Activity className="w-3 h-3" />
                            {formatNumber(profile.view_count)} Views
                        </div>
                    </div>

                    {/* Premium Badges Logic */}
                    <div className="flex flex-wrap gap-2">
                        {profile.category && (
                            <Badge variant="info" className="premium-gradient border-none text-[10px] py-1 font-black">
                                {profile.category.name}
                            </Badge>
                        )}
                        {profile.follower_count >= 10 && (
                            <Badge variant="gold" className="animate-float">
                                ★ Rising Star
                            </Badge>
                        )}
                        {profile.view_count >= 100 && (
                            <Badge variant="premium">
                                Popular
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Social Grid (Compact & Stylish) */}
                {visibleAccounts.length > 0 && (
                    <div className="mt-6">
                        <div className="flex grid grid-cols-4 gap-2">
                            {visibleAccounts.slice(0, 4).map((account) => {
                                const platform = SOCIAL_PLATFORMS.find(p => p.name === account.platform)
                                return (
                                    <a
                                        key={account.id}
                                        href={account.platform_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={account.platform}
                                        className="aspect-square rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 hover:skew-y-3 shadow-sm hover:shadow-md"
                                        style={{ backgroundColor: platform?.color || '#6366f1' }}
                                    >
                                        <DynamicIcon name={platform?.icon || 'globe'} className="w-5 h-5" />
                                    </a>
                                )
                            })}
                            {visibleAccounts.length > 4 && (
                                <Link
                                    href={`/${profile.slug}`}
                                    className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex flex-col xs:flex-row gap-2 mt-6">
                    <Link href={`/${profile.slug}`} className="flex-1">
                        <button className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gray-50 text-gray-900 border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn">
                            View Profile
                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    </Link>

                    {!isOwnProfile && user && (
                        <div className="flex-1">
                            <SendCardButton
                                receiverId={profile.user_id}
                                receiverName={profile.display_name}
                                profileId={profile.id}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}
