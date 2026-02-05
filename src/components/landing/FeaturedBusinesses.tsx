'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { UserCard } from '@/components/dashboard/UserCard'
import type { Profile } from '@/types/user.types'

export function FeaturedBusinesses() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const { data } = await supabase
                    .from('creator_cards_view')
                    .select('*')
                    .order('priority_rank', { ascending: true })
                    .order('view_count', { ascending: false })
                    .order('follower_count', { ascending: false })
                    .limit(12)

                if (data) {
                    const mappedProfiles: Profile[] = data.map((row: any) => ({
                        id: row.profile_id,
                        user_id: row.user_id,
                        display_name: row.display_name,
                        slug: row.slug,
                        cover_image_url: row.cover_image_url,
                        follower_count: row.follower_count,
                        view_count: row.view_count,
                        location: row.location,
                        created_at: row.created_at,
                        is_vip: row.is_vip,
                        badge: row.badge,
                        category: row.category_name ? {
                            name: row.category_name,
                            slug: row.category_slug
                        } : null,
                        user: {
                            username: row.username,
                            avatar_url: row.avatar_url,
                            bio: row.bio,
                            is_verified: row.is_verified
                        },
                        social_accounts: row.social_accounts || []
                    } as any))
                    setProfiles(mappedProfiles)
                }
            } catch (error) {
                console.error('Error fetching featured profiles:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchProfiles()
    }, [])

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-[2.5rem]" />
                ))}
            </div>
        )
    }

    return (
        <section className="py-16">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2 uppercase flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary-600" />
                        Doanh nghiệp nổi bật
                    </h2>
                    <p className="text-gray-500 font-medium text-lg">Những đơn vị uy tín hàng đầu trên nền tảng</p>
                </div>
                <Link href="/explore">
                    <Button variant="outline" className="border-gray-200 font-bold px-8 h-12 rounded-2xl hover:border-primary-500 transition-all">
                        Xem tất cả danh bạ <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                {profiles.map(profile => (
                    <div key={profile.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700 h-full">
                        <UserCard profile={profile} />
                    </div>
                ))}
            </div>

            {/* Call to Action for Business */}
            <div className="mt-20 p-8 sm:p-12 rounded-[3.5rem] premium-gradient text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-primary-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl z-0" />
                <div className="relative z-10 space-y-4 text-center md:text-left max-w-xl">
                    <h3 className="text-2xl sm:text-4xl font-black leading-tight">Gia tăng uy tín & tiếp cận hàng nghìn đối tác</h3>
                    <p className="text-white/80 font-medium">Tạo profile chuyên nghiệp và xuất hiện tại các vị trí ưu tiên ngay hôm nay.</p>
                </div>
                <div className="relative z-10">
                    <Link href="/register">
                        <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-50 font-black h-16 px-10 rounded-2xl shadow-xl hover:scale-105 transition-transform border-none">
                            <Sparkles className="w-5 h-5 mr-2" />
                            Đăng ký VIP ngay
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    )
}
