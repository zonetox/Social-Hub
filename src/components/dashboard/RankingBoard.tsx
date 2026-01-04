'use client'

import { Profile } from '@/types/user.types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatNumber } from '@/lib/utils/formatting'
import { TrendingUp, Award, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface RankingBoardProps {
    profiles: Profile[]
}

export function RankingBoard({ profiles }: RankingBoardProps) {
    // Sort by followers and views to get top creators
    const topCreators = [...profiles]
        .sort((a, b) => (b.follower_count + b.view_count) - (a.follower_count + a.view_count))
        .slice(0, 5)

    if (topCreators.length === 0) return null

    return (
        <Card variant="glass" className="p-6 mb-8 border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                <TrendingUp size={120} className="text-primary-600" />
            </div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-12 h-12 premium-gradient rounded-2xl flex items-center justify-center shadow-lg animate-float">
                    <Award className="text-white w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        Weekly Stars
                    </h2>
                    <p className="text-sm font-medium text-primary-600">
                        Top performing creators this week
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                {topCreators.map((profile, index) => (
                    <Link
                        key={profile.id}
                        href={`/${profile.slug}`}
                        className="group"
                    >
                        <div className="flex flex-col items-center p-4 rounded-2xl bg-white/40 hover:bg-white/60 border border-white/20 transition-all hover:-translate-y-2 hover:shadow-xl">
                            <div className="relative mb-3">
                                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg z-10 ${index === 0 ? 'bg-yellow-400 text-yellow-950 scale-110' :
                                    index === 1 ? 'bg-gray-300 text-gray-800' :
                                        index === 2 ? 'bg-orange-400 text-orange-950' :
                                            'bg-white/80 text-gray-600'
                                    }`}>
                                    #{index + 1}
                                </div>
                                {profile.user?.avatar_url ? (
                                    <div className="w-16 h-16 relative rounded-2xl overflow-hidden border-2 border-white shadow-md group-hover:border-primary-400 transition-colors">
                                        <Image
                                            src={profile.user.avatar_url}
                                            alt={profile.display_name}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl premium-gradient border-2 border-white flex items-center justify-center shadow-md">
                                        <span className="text-xl font-bold text-white">
                                            {profile.display_name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="text-center w-full">
                                <p className="font-bold text-gray-900 text-sm truncate group-hover:text-primary-600 transition-colors">
                                    {profile.display_name}
                                </p>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                                        {formatNumber(profile.follower_count)} Fans
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </Card>
    )
}
