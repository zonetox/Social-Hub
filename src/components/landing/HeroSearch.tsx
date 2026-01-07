'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Sparkles, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export function HeroSearch() {
    const [query, setQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            // Navigate to hub with search query
            router.push(`/hub?q=${encodeURIComponent(query.trim())}`)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            <div className="relative group">
                {/* Glow Effect */}
                <div className={`absolute -inset-1 premium-gradient rounded-[2.5rem] blur-xl opacity-25 group-hover:opacity-40 transition duration-700 ${isFocused ? 'opacity-50 blur-2xl' : ''}`} />

                <form
                    onSubmit={handleSearch}
                    className={`relative flex items-center gap-4 p-2 bg-white/80 backdrop-blur-2xl border-white/50 rounded-[2.5rem] shadow-2xl transition-all duration-500 ${isFocused ? 'ring-2 ring-primary-500/20 scale-[1.02]' : ''}`}
                >
                    <div className="pl-6">
                        <div className="w-10 h-10 rounded-full premium-gradient flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <Sparkles className="w-5 h-5 text-white animate-pulse" />
                        </div>
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Tìm kiếm chuyên gia, bác sĩ, kỹ sư... bằng ngôn ngữ tự nhiên"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-lg md:text-xl font-medium text-gray-900 placeholder-gray-400 py-4"
                    />

                    <div className="flex items-center gap-2 pr-2">
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                        <Button
                            type="submit"
                            size="lg"
                            className="h-14 px-8 rounded-full premium-gradient border-none font-black shadow-xl hover:scale-105 transition-transform group"
                        >
                            <span className="hidden sm:inline">Tìm kiếm ngay</span>
                            <ArrowRight className="w-5 h-5 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </form>

                {/* Quick Shortcuts / Assistant Text */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Gợi ý:</p>
                    {['Bác sĩ tư vấn', 'Kiến trúc sư', 'Chuyên gia Marketing', 'Freelancer IT'].map((item) => (
                        <button
                            key={item}
                            onClick={() => {
                                setQuery(item)
                                inputRef.current?.focus()
                            }}
                            className="px-4 py-2 rounded-full glass border-white/20 text-gray-600 text-sm font-bold hover:bg-white hover:text-primary-600 transition-all"
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
