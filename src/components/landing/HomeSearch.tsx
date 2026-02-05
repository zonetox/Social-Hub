'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronDown, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Category } from '@/types/user.types'

export function HomeSearch() {
    const [query, setQuery] = useState('')
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [isFocused, setIsFocused] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('profile_categories')
                .select('*')
                .order('display_order', { ascending: true })
            if (data) setCategories(data)
        }
        fetchCategories()
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams()
        if (query.trim()) params.append('q', query.trim())
        if (selectedCategory) params.append('category', selectedCategory)

        router.push(`/explore?${params.toString()}`)
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <form
                onSubmit={handleSearch}
                className={`flex flex-col md:flex-row items-stretch gap-2 p-2 bg-white rounded-2xl md:rounded-full shadow-2xl transition-all duration-300 ${isFocused ? 'ring-2 ring-primary-500/20' : ''}`}
            >
                {/* Keyword Search */}
                <div className="flex-1 flex items-center px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        type="text"
                        placeholder="Bạn đang tìm kiếm gì? (Ví dụ: Marketing, IT...)"
                        className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400 font-medium"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                </div>

                {/* Category Dropdown */}
                <div className="relative flex items-center px-4 py-2 min-w-[200px]">
                    <select
                        className="w-full bg-transparent border-none focus:ring-0 text-gray-700 font-bold appearance-none cursor-pointer pr-8"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">Tất cả danh mục</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.slug}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Search Button */}
                <button
                    type="submit"
                    className="premium-gradient text-white px-8 py-4 rounded-xl md:rounded-full font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary-500/20"
                >
                    <Sparkles className="w-4 h-4" />
                    <span>Tìm ngay</span>
                </button>
            </form>

            {/* Quick Suggestions */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Gợi ý:</span>
                {['Bác sĩ', 'Kỹ sư', 'Thiết kế', 'Luật sư'].map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setQuery(s)}
                        className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    )
}
