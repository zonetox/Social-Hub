'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/Button'
import { UserCard } from '@/components/dashboard/UserCard'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { HeroSearch } from '@/components/landing/HeroSearch'
import { HeroSlider } from '@/components/landing/HeroSlider'
import { CategoryFilter } from '@/components/landing/CategoryFilter'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Profile } from '@/types/user.types'
import Link from 'next/link'
import { Sparkles, ArrowRight, AppWindow, Users, Clock, Briefcase } from 'lucide-react'

export default function LandingPage() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchProfiles()
        fetchRequests()
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

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('service_requests')
                .select(`
                    id,
                    title,
                    created_at,
                    status,
                    budget,
                    category:profile_categories(name)
                `)
                .eq('status', 'open')
                .order('created_at', { ascending: false })
                .limit(8)

            if (data) setRequests(data)
        } catch (error) {
            console.error('Error fetching requests:', error)
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Premium Navigation */}
            <SiteHeader />

            {/* Hero Slider Section */}
            <HeroSlider />

            {/* Category Filter */}
            <CategoryFilter
                activeCategory={activeCategory}
                onCategorySelect={setActiveCategory}
            />

            {/* Latest Requests Section - NEW */}
            {!activeCategory && requests.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 py-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-amber-500 fill-current" />
                                Cơ hội việc làm mới
                            </h2>
                            <p className="text-gray-500 text-sm font-medium mt-1">Các dự án đang tìm kiếm chuyên gia</p>
                        </div>
                        <Link href="/requests">
                            <Button variant="ghost" className="text-primary-600 hover:bg-primary-50 font-bold group">
                                Xem tất cả <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {requests.map((req: any) => (
                            <Link key={req.id} href={`/requests/${req.id}`} className="block h-full">
                                <div className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary-50 to-white -mr-8 -mt-8 rounded-full z-0 group-hover:scale-150 transition-transform duration-500" />

                                    <div className="relative z-10 flex items-start justify-between mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">
                                            {req.category?.name || 'Chung'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-1 rounded-lg flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(req.created_at).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-gray-900 leading-snug mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                                        {req.title}
                                    </h3>

                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-900">
                                            {req.budget ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(req.budget) : 'Thương lượng'}
                                        </span>
                                        <span className="text-[10px] font-bold text-white bg-primary-600 px-3 py-1.5 rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-lg shadow-primary-500/20">
                                            Ứng tuyển
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Main Directory Grid */}
            <section className="max-w-7xl mx-auto px-4 py-8 border-t border-gray-100">
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
