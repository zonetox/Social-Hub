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
    MoreHorizontal
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
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('profile_categories')
                .select('*')
                .order('display_order', { ascending: true })

            if (data) setCategories(data)
            setLoading(false)
        }
        fetchCategories()
    }, [])

    if (loading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide py-10">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="min-w-[140px] h-32 bg-gray-100 animate-pulse rounded-3xl" />
                ))}
            </div>
        )
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Khám phá theo lĩnh vực</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent ml-8" />
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 h-52 items-center">
                <button
                    onClick={() => onCategorySelect(null)}
                    className={clsx(
                        "min-w-[140px] h-40 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-500 border group",
                        !activeCategory
                            ? "premium-gradient border-none text-white shadow-2xl shadow-primary-500/20 scale-105"
                            : "bg-white border-white/50 text-gray-600 hover:border-primary-200 hover:shadow-xl"
                    )}
                >
                    <div className={clsx(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                        !activeCategory ? "bg-white/20" : "bg-gray-50 group-hover:bg-primary-50"
                    )}>
                        <MoreHorizontal className="w-7 h-7" />
                    </div>
                    <span className="font-bold text-sm">Tất cả</span>
                </button>

                {categories.map((cat) => {
                    const Icon = iconMap[cat.icon || ''] || MoreHorizontal
                    const isActive = activeCategory === cat.slug

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onCategorySelect(cat.slug)}
                            className={clsx(
                                "min-w-[140px] h-40 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all duration-500 border group",
                                isActive
                                    ? "premium-gradient border-none text-white shadow-2xl shadow-primary-500/20 scale-105"
                                    : "bg-white border-white/50 text-gray-600 hover:border-primary-200 hover:shadow-xl"
                            )}
                        >
                            <div className={clsx(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                                isActive ? "bg-white/20" : "bg-gray-50 group-hover:bg-primary-50"
                            )}>
                                <Icon className="w-7 h-7" />
                            </div>
                            <span className="font-bold text-sm">{cat.name}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
