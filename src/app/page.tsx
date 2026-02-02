'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/Button'
import { UserCard } from '@/components/dashboard/UserCard'
import { HeroSearch } from '@/components/landing/HeroSearch'
import { CategoryFilter } from '@/components/landing/CategoryFilter'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Profile } from '@/types/user.types'
import Link from 'next/link'
import { Sparkles, ArrowRight, AppWindow, Users } from 'lucide-react'

export default function LandingPage() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchProfiles()
    }, [activeCategory])

    const fetchProfiles = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('creator_cards_view')
                .select('*')
                .order('priority_rank', { ascending: true })
                .order('view_count', { ascending: false })
                .order('created_at', { ascending: false })

            if (activeCategory) {
                query = query.eq('category_slug', activeCategory)
            }

            const { data, error } = await query.limit(12)

            if (error) throw error

            // Map flat view data to nested Profile structure
            const mappedProfiles: Profile[] = (data || []).map((row: any) => ({
                id: row.profile_id,
                user_id: row.user_id,
                display_name: row.display_name,
                slug: row.slug,
                cover_image_url: row.cover_image_url,
                follower_count: row.follower_count,
                view_count: row.view_count,
                location: row.location,
                tags: [], // Not in view, sending empty
                is_public: true, // Implicit
                created_at: row.created_at,
                category: row.category_name ? {
                    id: 'view_generated', // Placeholder
                    name: row.category_name,
                    slug: row.category_slug || '',
                    icon: null
                } : null,
                user: {
                    id: row.user_id,
                    username: row.username,
                    full_name: row.display_name, // Fallback
                    avatar_url: row.avatar_url,
                    bio: row.bio,
                    is_verified: row.is_verified,
                    role: 'user', // Default
                    email: '', // Not exposed
                    is_active: true
                },
                social_accounts: row.social_accounts || [],
                // Extra properties for VIP
                is_vip: row.is_vip,
                priority_rank: row.priority_rank,
                badge: row.badge
            } as any))

            setProfiles(mappedProfiles)
        } catch (error) {
            console.error('Error fetching landing profiles:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Premium Navigation */}
            <nav className="glass sticky top-0 z-50 border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
                    <Logo size="sm" />
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden sm:block">
                            <Button variant="ghost" className="font-bold text-gray-600">Đăng nhập</Button>
                        </Link>
                        <Link href="/register">
                            <Button className="premium-gradient border-none font-black shadow-xl shadow-primary-500/10 hover:scale-105 transition-transform px-4 sm:px-8 h-10 sm:h-12 text-sm sm:text-base">
                                Tham gia ngay
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero & Chat Search Section */}
            <section className="relative pt-20 pb-16 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-primary-500/5 blur-[150px] rounded-full -z-10 animate-pulse" />

                <div className="max-w-7xl mx-auto text-center px-4">
                    <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full glass border-white/40 text-primary-600 text-[10px] sm:text-sm font-black mb-6 sm:mb-8 animate-float shadow-xl shadow-primary-500/5">
                        <Sparkles className="w-5 h-5" />
                        DANH BẠ CARD VISIT THÔNG MINH
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-gray-900 mb-6 sm:mb-8 tracking-tighter leading-[1.1] sm:leading-[0.9]">
                        Kết Nối <span className="text-transparent bg-clip-text premium-gradient">Mọi Lĩnh Vực</span><br className="hidden sm:block" />
                        Trong Tầm Tay
                    </h1>

                    <p className="text-base sm:text-lg md:text-2xl text-gray-500 mb-10 sm:mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                        Tìm kiếm đối tác, chuyên gia và dịch vụ thông qua hệ thống thẻ VISIT kỹ thuật số thế hệ mới.
                    </p>

                    <HeroSearch />
                </div>
            </section>

            {/* Category Filter */}
            <CategoryFilter
                activeCategory={activeCategory}
                onCategorySelect={setActiveCategory}
            />

            {/* Main Directory Grid */}
            <section className="max-w-7xl mx-auto px-4 py-20">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 sm:mb-12 gap-6">
                    <div>
                        <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
                            {activeCategory ? `Chuyên gia ${activeCategory}` : 'Tất cả chuyên gia'}
                        </h2>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {profiles.length} Card Visit đang hiển thị
                        </p>
                    </div>
                    <Link href="/hub" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto h-12 sm:h-14 px-8 rounded-2xl border-gray-200 font-bold hover:bg-white hover:border-primary-500 transition-all text-sm sm:text-base">
                            Xem tất cả danh bạ
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <LoadingSpinner size="lg" />
                        <p className="text-gray-400 font-bold animate-pulse">ĐANG TẢI DANH BẠ...</p>
                    </div>
                ) : profiles.length === 0 ? (
                    <div className="glass p-10 sm:p-20 rounded-[2rem] sm:rounded-[3rem] text-center border-dashed border-2 border-gray-200">
                        <AppWindow className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-6" />
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Chưa có card visit nào</h3>
                        <p className="text-sm sm:text-base text-gray-500 mb-8">Hãy là người đầu tiên tham gia lĩnh vực này!</p>
                        <Link href="/register">
                            <Button className="premium-gradient border-none px-8 sm:px-10 h-12 sm:h-14 font-black rounded-2xl">Bắt đầu ngay</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
                        {profiles.map(profile => (
                            <div key={profile.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700 h-full">
                                <UserCard profile={profile} />
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="py-20 glass mt-32 border-t border-white/20">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="space-y-4 text-center md:text-left">
                        <Logo size="lg" />
                        <p className="max-w-sm text-gray-500 font-medium">
                            Nền tảng danh bạ card visit kỹ thuật số hàng đầu Việt Nam. Nâng tầm thương hiệu cá nhân của bạn.
                        </p>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-2">
                        <p className="text-gray-900 font-black tracking-tight text-xl">© 2024 Social HUB</p>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Premium Digital Identity Platform</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
