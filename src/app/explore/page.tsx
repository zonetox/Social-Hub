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
import { SiteHeader } from '@/components/shared/SiteHeader'

const RankingBoard = dynamicImport(() => import('@/components/dashboard/RankingBoard').then(mod => mod.RankingBoard), {
    loading: () => <div className="h-40 bg-gray-50 animate-pulse rounded-2xl mb-8" />,
    ssr: false
})

import { useSearchParams } from 'next/navigation'

export default function ExplorePage() {
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

    return (
        <div className="min-h-screen bg-gray-50">
            <SiteHeader />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="relative">
                    {/* Artistic Header Background */}
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-400/20 blur-[100px] rounded-full -z-10 animate-pulse" />
                    <div className="absolute top-40 -right-20 w-96 h-96 bg-secondary-400/20 blur-[120px] rounded-full -z-10" />

                    {/* Header */}
                    <div className="mb-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-white/20 text-primary-600 text-sm font-bold mb-4 animate-float">
                            <Sparkles className="w-4 h-4" />
                            Cộng đồng Social HUB
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tighter">
                            Khám phá <span className="text-transparent bg-clip-text premium-gradient">Những Người Sáng Tạo</span>
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto font-medium px-4">
                            Kết nối với <span className="font-bold text-gray-900">{profiles.length}</span> chuyên gia và nhãn hàng nổi bật trên mọi nền tảng.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <>
                            {/* Top Creators Ranking */}
                            <RankingBoard profiles={profiles} />

                            {/* Search & Filter Bar */}
                            <div className="mb-10 sticky top-24 z-20">
                                <div className="relative max-w-2xl mx-auto group">
                                    <div className="absolute -inset-1 premium-gradient rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Tìm kiếm người sáng tạo..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-14 pl-12 bg-white/80 backdrop-blur-xl border-white/50 rounded-2xl shadow-xl focus:ring-primary-500 text-base"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shadow-inner">
                                            <Users className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-gray-900">{profiles.length}</p>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hồ sơ công khai</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center shadow-inner">
                                            <Search className="w-6 h-6 text-secondary-600" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-gray-900">{filteredProfiles.length}</p>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kết quả tìm thấy</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shadow-inner">
                                            <Sparkles className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-gray-900">
                                                {profiles.reduce((sum, p) => sum + (p.social_accounts?.length || 0), 0)}
                                            </p>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Liên kết kết nối</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Profiles Grid */}
                            {filteredProfiles.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        Không tìm thấy hồ sơ nào
                                    </h3>
                                    <p className="text-gray-500 font-medium">
                                        {searchQuery
                                            ? 'Hãy thử thay đổi từ khóa tìm kiếm của bạn'
                                            : 'Hãy là người đầu tiên tạo hồ sơ!'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredProfiles.map(profile => (
                                        <UserCard
                                            key={profile.id}
                                            profile={profile}
                                            onFollowChange={fetchProfiles}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
