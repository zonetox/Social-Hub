'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types/user.types'
import {
    Cpu,
    GraduationCap,
    Stethoscope,
    Wallet,
    Home,
    Megaphone,
    Music,
    MoreHorizontal,
    Briefcase,
    Store
} from 'lucide-react'
import clsx from 'clsx'

const iconMap: { [key: string]: any } = {
    Cpu,
    GraduationCap,
    Stethoscope,
    Wallet,
    Home,
    Megaphone,
    Music,
    MoreHorizontal
}

interface CategoryFilterProps {
    onCategorySelect: (slug: string | null) => void
    activeCategory: string | null
}

export function CategoryFilter({ onCategorySelect, activeCategory }: CategoryFilterProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [counts, setCounts] = useState<Record<string, { businesses: number, requests: number }>>({})
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch Categories
            const { data: catData } = await supabase
                .from('profile_categories')
                .select('*')
                .order('display_order', { ascending: true })

            if (catData) setCategories(catData)

            // 2. Fetch Counts (Client-side aggregation as per constraint)
            // Fetch all cards categories
            const { data: cards } = await supabase.from('creator_cards_view').select('category_slug')
            const { data: reqs } = await supabase.from('service_requests').select('category:profile_categories(slug)')

            const newCounts: Record<string, { businesses: number, requests: number }> = {}

            // Count Businesses
            cards?.forEach((c: any) => {
                const slug = c.category_slug || 'uncategorized'
                if (!newCounts[slug]) newCounts[slug] = { businesses: 0, requests: 0 }
                newCounts[slug].businesses++
            })

            // Count Requests
            reqs?.forEach((r: any) => {
                const slug = (r.category as any)?.slug
                if (slug) {
                    if (!newCounts[slug]) newCounts[slug] = { businesses: 0, requests: 0 }
                    newCounts[slug].requests++
                }
            })

            setCounts(newCounts)
            setLoading(false)
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <section className="w-full max-w-7xl mx-auto px-4 py-16">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Danh mục ngành nghề</h2>
                    <p className="text-gray-500">Khám phá các lĩnh vực hoạt động sôi nổi nhất</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <button
                    onClick={() => onCategorySelect(null)}
                    className={clsx(
                        "p-4 rounded-2xl border transition-all duration-300 flex flex-col items-start justify-between min-h-[140px] group text-left",
                        !activeCategory
                            ? "bg-gray-900 border-gray-900 text-white shadow-lg"
                            : "bg-white border-gray-100 text-gray-600 hover:border-primary-200 hover:shadow-md hover:-translate-y-1"
                    )}
                >
                    <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                        !activeCategory ? "bg-white/20" : "bg-gray-50 text-gray-400 group-hover:text-primary-600 group-hover:bg-primary-50"
                    )}>
                        <MoreHorizontal className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="font-bold text-sm block mb-1">Tất cả ngành</span>
                        <span className={clsx("text-xs font-semibold", !activeCategory ? "text-gray-400" : "text-gray-400")}>
                            Toàn bộ danh bạ
                        </span>
                    </div>
                </button>

                {categories.map((cat) => {
                    const Icon = iconMap[cat.icon || ''] || MoreHorizontal
                    const isActive = activeCategory === cat.slug
                    const stat = counts[cat.slug] || { businesses: 0, requests: 0 }

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onCategorySelect(cat.slug)}
                            className={clsx(
                                "p-4 rounded-2xl border transition-all duration-300 flex flex-col items-start justify-between min-h-[140px] group text-left",
                                isActive
                                    ? "premium-gradient border-none text-white shadow-xl scale-105 z-10"
                                    : "bg-white border-gray-100 text-gray-600 hover:border-primary-200 hover:shadow-md hover:-translate-y-1"
                            )}
                        >
                            <div className={clsx(
                                "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                                isActive ? "bg-white/20" : "bg-gray-50 text-gray-400 group-hover:text-primary-600 group-hover:bg-primary-50"
                            )}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="w-full">
                                <span className="font-bold text-sm block mb-1 truncate w-full">{cat.name}</span>
                                <div className="flex items-center gap-3 text-[10px] font-semibold opacity-80">
                                    <span className="flex items-center gap-1">
                                        <Briefcase className="w-3 h-3" /> {stat.businesses}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Store className="w-3 h-3" /> {stat.requests}
                                    </span>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </section>
    )
}
