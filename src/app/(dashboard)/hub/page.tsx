'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCard } from '@/components/dashboard/UserCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Input } from '@/components/ui/Input'
import { Search, Users, Sparkles } from 'lucide-react'
import type { Profile } from '@/types/user.types'
import dynamicImport from 'next/dynamic'

const RankingBoard = dynamicImport(() => import('@/components/dashboard/RankingBoard').then(mod => mod.RankingBoard), {
    loading: () => <div className="h-40 bg-gray-50 animate-pulse rounded-2xl mb-8" />,
    ssr: false
})

import { useSearchParams } from 'next/navigation'

export default function HubPage() {
    const searchParams = useSearchParams()
    const initialQuery = searchParams.get('q') || ''

    const [profiles, setProfiles] = useState<Profile[]>([])
    const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState(initialQuery)
    const supabase = createClient()

    useEffect(() => {
        fetchProfiles()
    }, [])

    useEffect(() => {
        if (!searchQuery) {
            setFilteredProfiles(profiles)
            return
        }

        const query = searchQuery.toLowerCase()
        const filtered = profiles.filter(profile =>
            profile.display_name.toLowerCase().includes(query) ||
            profile.user?.username.toLowerCase().includes(query) ||
            profile.user?.bio?.toLowerCase().includes(query) ||
            profile.tags?.some(tag => tag.toLowerCase().includes(query))
        )
        setFilteredProfiles(filtered)
    }, [searchQuery, profiles])

    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id, 
                    display_name, 
                    slug, 
                    cover_image_url, 
                    follower_count, 
                    view_count, 
                    location, 
                    tags,
                    user:users(id, username, full_name, avatar_url, bio, is_verified),
                    social_accounts(id, platform, platform_url, display_order, is_visible)
                `)
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .returns<Profile[]>()

            if (error) throw error

            // Sort social accounts for each profile
            data?.forEach(profile => {
                if (profile.social_accounts) {
                    profile.social_accounts.sort((a, b) => a.display_order - b.display_order)
                }
            })

            setProfiles(data || [])
            setFilteredProfiles(data || [])
        } catch (error) {
            console.error('Error fetching profiles:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="relative">
            {/* Artistic Header Background */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-400/20 blur-[100px] rounded-full -z-10 animate-pulse" />
            <div className="absolute top-40 -right-20 w-96 h-96 bg-secondary-400/20 blur-[120px] rounded-full -z-10" />

            {/* Header */}
            <div className="mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-white/20 text-primary-600 text-sm font-bold mb-4 animate-float">
                    <Sparkles className="w-4 h-4" />
                    Community HUB
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tighter">
                    Discover <span className="text-transparent bg-clip-text premium-gradient">Top Creators</span>
                </h1>
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto font-medium px-4">
                    The next generation of digital networking. Connect with <span className="font-bold text-gray-900">{profiles.length}</span> creators across all platforms.
                </p>
            </div>

            {/* Top Creators Ranking */}
            <RankingBoard profiles={profiles} />

            {/* Search & Filter Bar */}
            <div className="mb-10 sticky top-4 z-20">
                <div className="relative max-w-2xl mx-auto group">
                    <div className="absolute -inset-1 premium-gradient rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Find a creator..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-14 pl-12 bg-white/80 backdrop-blur-xl border-white/50 rounded-2xl shadow-xl focus:ring-primary-500 text-base"
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
                            <p className="text-sm text-gray-600">Total Creators</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                            <Search className="w-5 h-5 text-secondary-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{filteredProfiles.length}</p>
                            <p className="text-sm text-gray-600">Search Results</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {profiles.reduce((sum, p) => sum + (p.social_accounts?.length || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-600">Total Accounts</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profiles Grid */}
            {filteredProfiles.length === 0 ? (
                <div className="text-center py-20">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No profiles found
                    </h3>
                    <p className="text-gray-600">
                        {searchQuery
                            ? 'Try adjusting your search query'
                            : 'Be the first to create a profile!'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProfiles.map(profile => (
                        <UserCard
                            key={profile.id}
                            profile={profile}
                            onFollowChange={fetchProfiles}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
