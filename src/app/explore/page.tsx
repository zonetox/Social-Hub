'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCard } from '@/components/dashboard/UserCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DashboardErrorState } from '@/components/dashboard/DashboardStates'
import { Input } from '@/components/ui/Input'
import { Search, Users, Sparkles } from 'lucide-react'
// ... imports

// ... dynamic imports

import { useSearchParams } from 'next/navigation'

export default function ExplorePage() {
    const searchParams = useSearchParams()
    const initialQuery = searchParams.get('q') || ''

    const [profiles, setProfiles] = useState<Profile[]>([])
    const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState(initialQuery)
    const supabase = createClient()

    useEffect(() => {
        fetchProfiles()
    }, [])

    // ... search effect

    const fetchProfiles = async () => {
        try {
            setLoading(true)
            setError(null)
            const { data, error } = await supabase
                // ... select
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

            // ... processing

            setProfiles(data || [])
            setFilteredProfiles(data || [])
        } catch (error: any) {
            console.error('Error fetching profiles:', error)
            setError(error.message || 'Không thể tải danh sách hồ sơ.')
        } finally {
            setLoading(false)
        }
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <SiteHeader />
                <DashboardErrorState
                    message={error}
                    onRetry={fetchProfiles}
                />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <SiteHeader />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="relative">
                    {/* ... */}

                    {/* Header */}
                    {/* ... */}

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
