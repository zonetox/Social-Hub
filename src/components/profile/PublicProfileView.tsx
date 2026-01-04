// @ts-nocheck
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatNumber } from '@/lib/utils/formatting'
import { SOCIAL_PLATFORMS } from '@/lib/utils/constants'
import { QRCodeModal } from '@/components/profile/QRCodeModal'
import {
    Heart,
    MapPin,
    Link2,
    Globe,
    CheckCircle,
    Share2,
    ExternalLink,
    Copy,
    Check,
    QrCode,
    Sparkles,
    UserPlus,
    Plus
} from 'lucide-react'
import type { Profile } from '@/types/user.types'
import clsx from 'clsx'

interface PublicProfileViewProps {
    profile: Profile
}

export function PublicProfileView({ profile }: PublicProfileViewProps) {
    const { user } = useAuth()
    const [isFollowing, setIsFollowing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showQR, setShowQR] = useState(false)
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
        } catch (error) {
            console.error('Follow error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSocialClick = async (accountId: string, url: string) => {
        try {
            await supabase.from('analytics').insert({
                profile_id: profile.id,
                event_type: 'click',
                social_account_id: accountId,
            } as any)
            await supabase.rpc('increment_social_click', { account_id: accountId })
        } catch (error) {
            console.error('Track click error:', error)
        }
        window.open(url, '_blank')
    }

    return (
        <div className="min-h-screen relative overflow-hidden pb-20">
            {/* Dynamic Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary-500/10 blur-[120px] rounded-full" />
            </div>

            {/* Premium Navbar */}
            <nav className="sticky top-4 z-50 max-w-5xl mx-auto px-4">
                <div className="glass px-6 py-3 rounded-2xl flex items-center justify-between border-white/40 shadow-2xl">
                    <a href="/hub" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12">
                            <Sparkles className="text-white w-5 h-5" />
                        </div>
                        <span className="font-black text-gray-900 tracking-tighter text-xl hidden sm:block">Social HUB</span>
                    </a>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowQR(true)}
                            className="p-3 bg-white/80 hover:bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:scale-110 text-gray-700"
                            title="Digital Business Card"
                        >
                            <QrCode className="w-5 h-5" />
                        </button>

                        {!isOwnProfile && user && (
                            <Button
                                size="sm"
                                variant={isFollowing ? 'outline' : 'primary'}
                                onClick={handleFollow}
                                isLoading={isLoading}
                                className={clsx(
                                    "rounded-xl font-bold h-11 px-6",
                                    !isFollowing && "premium-gradient border-none shadow-lg animate-glow"
                                )}
                            >
                                {isFollowing ? 'Following' : 'Follow Creator'}
                            </Button>
                        )}

                        {isOwnProfile && (
                            <a href="/profile">
                                <Button size="sm" className="premium-gradient border-none rounded-xl h-11 px-6 text-white font-bold shadow-lg">
                                    Manage Hub
                                </Button>
                            </a>
                        )}
                    </div>
                </div>
            </nav>

            {/* Profile Content */}
            <main className="max-w-4xl mx-auto px-4 mt-12">
                <Card variant="glass" className="border-none shadow-2xl overflow-hidden mb-12">
                    {/* Artistic Cover */}
                    <div className="h-64 relative group overflow-hidden">
                        {profile.cover_image_url ? (
                            <img
                                src={profile.cover_image_url}
                                alt="Cover"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full premium-gradient animate-gradient-xy" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                        {/* Quick Action Badges */}
                        <div className="absolute top-6 left-6 flex gap-2">
                            <Badge variant="glass-dark" className="border-white/20">
                                <Globe className="w-3 h-3 mr-1" />
                                {formatNumber(profile.view_count)} Views
                            </Badge>
                            {profile.follower_count > 10 && (
                                <Badge variant="gold">
                                    ★ Top 10 Creator
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="p-8 md:p-12 relative">
                        {/* Avatar Redesign */}
                        <div className="flex flex-col items-center text-center -mt-32 mb-8 relative z-10">
                            <div className="relative mb-6">
                                {profile.user?.avatar_url ? (
                                    <img
                                        src={profile.user.avatar_url}
                                        alt={profile.display_name}
                                        className="w-48 h-48 rounded-[3rem] border-8 border-white shadow-2xl object-cover animate-float"
                                    />
                                ) : (
                                    <div className="w-48 h-48 rounded-[3rem] border-8 border-white shadow-2xl premium-gradient flex items-center justify-center animate-float">
                                        <span className="text-7xl font-bold text-white">
                                            {profile.display_name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                {profile.user?.is_verified && (
                                    <div className="absolute bottom-4 right-4 bg-white rounded-2xl p-2 shadow-xl border border-gray-100">
                                        <CheckCircle className="w-8 h-8 text-primary-500 fill-current" />
                                    </div>
                                )}
                            </div>

                            <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">
                                {profile.display_name}
                            </h1>
                            <p className="text-xl font-bold text-primary-600 mb-6 bg-primary-50 px-4 py-1 rounded-full border border-primary-100">
                                @{profile.user?.username}
                            </p>

                            {profile.user?.bio && (
                                <p className="text-xl text-gray-600 max-w-2xl font-medium leading-relaxed italic">
                                    "{profile.user.bio}"
                                </p>
                            )}
                        </div>

                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-gray-100/50 mb-12">
                            <div className="text-center group">
                                <p className="text-3xl font-black text-gray-900 group-hover:text-primary-600 transition-colors">
                                    {formatNumber(profile.follower_count)}
                                </p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fans</p>
                            </div>
                            <div className="text-center group">
                                <p className="text-3xl font-black text-gray-900 group-hover:text-primary-600 transition-colors">
                                    {formatNumber(visibleAccounts.length)}
                                </p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Connects</p>
                            </div>
                            <div className="text-center group">
                                <p className="text-3xl font-black text-gray-900 group-hover:text-primary-600 transition-colors">
                                    {formatNumber(profile.view_count)}
                                </p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reach</p>
                            </div>
                            <div className="text-center group">
                                <div className="flex items-center justify-center gap-1 text-3xl font-black text-gray-900">
                                    <MapPin className="w-5 h-5 text-gray-400" />
                                    <span className="truncate max-w-[100px]">{profile.location?.split(',')[0] || 'Web'}</span>
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Base</p>
                            </div>
                        </div>

                        {/* Social Links Layout - Premium Style */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-gray-200" />
                                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">Official Links</h2>
                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-gray-200" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {visibleAccounts.map((account) => {
                                    const platform = SOCIAL_PLATFORMS.find(p => p.name === account.platform)
                                    return (
                                        <button
                                            key={account.id}
                                            onClick={() => handleSocialClick(account.id, account.platform_url)}
                                            className="group relative flex items-center gap-4 p-5 bg-white/60 hover:bg-white rounded-[2rem] border border-white/50 shadow-sm transition-all hover:scale-[1.03] hover:shadow-2xl text-left"
                                        >
                                            <div
                                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12 group-hover:scale-110"
                                                style={{ backgroundColor: platform?.color || '#6366f1' }}
                                            >
                                                <ExternalLink className="w-8 h-8 opacity-80" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-black text-gray-900">{account.platform}</h3>
                                                    <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {formatNumber(account.click_count)} CLICKS
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 font-medium truncate">@{account.platform_username}</p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            {visibleAccounts.length === 0 && (
                                <div className="py-20 text-center text-gray-400">
                                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-bold">This creator hasn't linked any socials yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </main>

            {/* Modals */}
            <QRCodeModal
                isOpen={showQR}
                onClose={() => setShowQR(false)}
                url={typeof window !== 'undefined' ? window.location.href : ''}
                display_name={profile.display_name}
            />

            {/* Premium Decor Footer */}
            <footer className="text-center mt-20">
                <div className="inline-flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
                    <span>Profile Secured by</span>
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    <span className="text-gray-900 font-black">Social Hub</span>
                </div>
            </footer>
        </div>
    )
}
