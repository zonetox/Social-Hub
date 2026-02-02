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

    // Cast profile to any to access VIP props passed from view
    const isVip = (profile as any).is_vip
    const vipBadge = (profile as any).badge

    const handleFollow = async () => {
        if (!user || isOwnProfile) return
        setIsLoading(true)
        try {
            if (isFollowing) {
                await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.user_id)
                setIsFollowing(false)
            } else {
                await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.user_id } as any)
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
        <Card
            variant="glass"
            hover
            className={clsx(
                "overflow-hidden group transition-all duration-300 h-full flex flex-col border border-white/40",
                // VIP: Golden Soft Glow, Standard: Subtle Hover Lift
                isVip
                    ? "ring-1 ring-amber-300/50 shadow-[0_8px_30px_-8px_rgba(251,191,36,0.25)] hover:shadow-[0_12px_40px_-10px_rgba(251,191,36,0.35)]"
                    : "hover:shadow-xl hover:shadow-primary-500/5"
            )}
        >
            {/* Cover Image with Overlay */}
            <div className="relative h-24 sm:h-32 overflow-hidden shrink-0">
                {profile.cover_image_url ? (
                    <Image
                        src={profile.cover_image_url}
                        alt="Cover"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full premium-gradient opacity-90" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />

                {/* Followers Quick Badge - Mobile Optimized */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
                    {isVip && (
                        <Badge className="bg-gradient-to-r from-amber-300 to-yellow-500 text-white border-none shadow-sm font-black px-2 py-0.5 text-[10px] sm:text-xs">
                            {vipBadge || 'VIP'}
                        </Badge>
                    )}
                    <Badge variant="glass-dark" className="backdrop-blur-md border-white/20 text-white text-[10px] sm:text-xs px-2 h-5 sm:h-6">
                        <Users className="w-3 h-3 mr-1" />
                        {formatNumber(profile.follower_count)}
                    </Badge>
                </div>
            </div>

            <div className="p-3 sm:p-5 flex-1 flex flex-col relative bg-white/40 backdrop-blur-sm">
                {/* Avatar & Name Section */}
                <div className="flex items-start justify-between -mt-10 sm:-mt-14 mb-3 relative z-10">
                    <div className="relative group/avatar">
                        {profile.user?.avatar_url ? (
                            <div className={clsx(
                                "w-16 h-16 sm:w-20 sm:h-20 relative rounded-2xl shadow-lg transition-transform group-hover/avatar:scale-105 overflow-hidden ring-4",
                                isVip ? "ring-amber-300/80" : "ring-white"
                            )}>
                                <Image
                                    src={profile.user.avatar_url}
                                    alt={profile.display_name}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                />
                            </div>
                        ) : (
                            <div className={clsx(
                                "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-lg premium-gradient flex items-center justify-center ring-4",
                                isVip ? "ring-amber-300/80" : "ring-white"
                            )}>
                                <span className="text-2xl sm:text-3xl font-bold text-white">
                                    {profile.display_name.charAt(0)}
                                </span>
                            </div>
                        )}
                        {profile.user?.is_verified && (
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 sm:p-1 shadow-sm">
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 fill-current" />
                            </div>
                        )}
                    </div>

                    {!isOwnProfile && user && (
                        <Button
                            size="sm"
                            variant={isFollowing ? 'outline' : 'primary'}
                            onClick={handleFollow}
                            isLoading={isLoading}
                            className={clsx(
                                "mt-8 sm:mt-10 rounded-lg sm:rounded-xl transition-all h-8 sm:h-9 text-xs sm:text-sm px-3",
                                !isFollowing && "premium-gradient border-none shadow-md hover:shadow-primary-500/20"
                            )}
                        >
                            {isFollowing ? (
                                <Heart className="w-3.5 h-3.5 fill-current" />
                            ) : (
                                "Follow"
                            )}
                        </Button>
                    )}
                </div>

                {/* Info & Stats */}
                <div className="space-y-2 mb-4">
                    <div>
                        <Link href={`/${profile.slug}`} className="hover:underline decoration-primary-500/30">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight line-clamp-1 tracking-tight">
                                {profile.display_name}
                            </h3>
                        </Link>
                        <p className="text-xs sm:text-sm font-medium text-primary-600/80 truncate">
                            @{profile.user?.username}
                        </p>
                    </div>

                    {profile.user?.bio && (
                        <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">
                            {profile.user.bio}
                        </p>
                    )}

                    {/* Meta Data - Compact */}
                    <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs font-medium text-gray-500/80">
                        {profile.location && (
                            <div className="flex items-center gap-1 bg-white/60 px-1.5 py-0.5 rounded-md border border-white/50">
                                <MapPin className="w-3 h-3" />
                                <span className="max-w-[80px] truncate">{profile.location}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1 bg-white/60 px-1.5 py-0.5 rounded-md border border-white/50">
                            <Activity className="w-3 h-3" />
                            {formatNumber(profile.view_count)}
                        </div>
                    </div>

                    {/* Tags/Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {profile.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-100">
                                {profile.category.name}
                            </span>
                        )}
                        {profile.follower_count >= 10 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                ★ Rising
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100/50">
                    {/* Social Grid (Ultra Compact) */}
                    {visibleAccounts.length > 0 ? (
                        <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar py-1">
                            {visibleAccounts.slice(0, 5).map((account) => {
                                const platform = SOCIAL_PLATFORMS.find(p => p.name === account.platform)
                                return (
                                    <a
                                        key={account.id}
                                        href={account.platform_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-white shadow-sm hover:scale-110 transition-transform"
                                        style={{ backgroundColor: platform?.color || '#94a3b8' }}
                                    >
                                        <DynamicIcon name={platform?.icon || 'globe'} className="w-3.5 h-3.5" />
                                    </a>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="h-10 mb-3" /> /* Spacer */
                    )}

                    <div className="flex gap-2">
                        <Link href={`/${profile.slug}`} className="flex-1">
                            <button className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs bg-gray-900 text-white shadow-lg shadow-gray-900/10 hover:shadow-gray-900/20 active:scale-95 transition-all">
                                View Profile
                            </button>
                        </Link>
                        {!isOwnProfile && user && (
                            <SendCardButton
                                receiverId={profile.user_id}
                                receiverName={profile.display_name}
                                profileId={profile.id}
                                className="w-9 h-full rounded-lg sm:rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 flex items-center justify-center transition-colors"
                            />
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}
