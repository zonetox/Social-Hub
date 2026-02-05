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
    Store,
    Users,
    ArrowRight
} from 'lucide-react'
import Link from 'next/link'

const iconMap: { [key: string]: any } = {
    Cpu,
    GraduationCap,
    Stethoscope,
    Wallet,
    Home,
    Megaphone,
    Music,
    Store,
    Briefcase,
    Users,
    MoreHorizontal
}

export function CategoryGrid() {
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-3xl" />
                ))}
            </div>
        )
    }

    return (
        <section className="py-16">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2 uppercase">Danh mục lĩnh vực</h2>
                    <p className="text-gray-500 font-medium">Khám phá các chuyên gia và cơ hội kinh doanh theo ngành nghề</p>
                </div>
                <Link href="/explore">
                    <button className="text-primary-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
                        Tất cả lĩnh vực <ArrowRight className="w-4 h-4" />
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
                {categories.map((cat) => {
                    const Icon = iconMap[cat.icon || ''] || Briefcase

                    return (
                        <Link
                            key={cat.id}
                            href={`/explore?category=${cat.slug}`}
                            className="group relative bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-200 hover:-translate-y-1.5 transition-all duration-500 overflow-hidden"
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-50/50 to-transparent rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />

                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 mb-6 shadow-sm">
                                    <Icon className="w-7 h-7" />
                                </div>

                                <h3 className="font-black text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
                                    {cat.name}
                                </h3>

                                <div className="mt-4 flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                                    Khám phá ngay <ArrowRight className="w-3 h-3 ml-1" />
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}
