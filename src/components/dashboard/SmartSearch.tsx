'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Search,
    X,
    User,
    Folder,
    Settings,
    Sparkles,
    ArrowRight,
    Command,
    Clock,
    UserPlus,
    Layout
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/lib/hooks/useAuth'

interface SmartSearchProps {
    isOpen: boolean
    onClose: () => void
}

export function SmartSearch({ isOpen, onClose }: SmartSearchProps) {
    const { user } = useAuth()
    const [query, setQuery] = useState('')
    const [history, setHistory] = useState<any[]>([])
    const [results, setResults] = useState<{
        profiles: any[]
        contacts: any[]
        actions: any[]
    }>({ profiles: [], contacts: [], actions: [] })
    const [loading, setLoading] = useState(false)
    const [assistantMessage, setAssistantMessage] = useState('Chào bạn! Tôi có thể giúp gì cho bạn hôm nay?')
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()

    // Actions list
    const actionItems = [
        { id: 'edit-profile', name: 'Chỉnh sửa Profile', icon: User, href: '/profile' },
        { id: 'settings', name: 'Cài đặt tài khoản', icon: Settings, href: '/settings' },
        { id: 'contacts', name: 'Quản lý danh bạ', icon: Folder, href: '/contacts' },
        { id: 'ranking', name: 'Bảng xếp hạng', icon: Sparkles, href: '/explore' },
    ]

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
            document.body.style.overflow = 'hidden'
            fetchHistory()
        } else {
            document.body.style.overflow = 'unset'
            setQuery('')
            setResults({ profiles: [], contacts: [], actions: [] })
        }
    }, [isOpen, user])

    const fetchHistory = async () => {
        if (!user) return
        try {
            const { data } = await supabase
                .from('search_history' as any)
                .select('query, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            // Filter unique queries
            const uniqueHistory = (data as any[])?.reduce((acc: any[], current) => {
                if (!acc.find(item => item.query === current.query)) {
                    acc.push(current)
                }
                return acc
            }, []) || []

            setHistory(uniqueHistory)
        } catch (error) {
            console.error('Fetch history error:', error)
        }
    }

    const saveToHistory = async (searchQuery: string) => {
        if (!user || !searchQuery.trim()) return
        try {
            await supabase.from('search_history' as any).insert({
                user_id: user.id,
                query: searchQuery.trim()
            } as any)
        } catch (error) {
            console.error('Save history error:', error)
        }
    }

    const clearHistory = async () => {
        if (!user) return
        try {
            await supabase.from('search_history' as any).delete().eq('user_id', user.id)
            setHistory([])
        } catch (error) {
            console.error('Clear history error:', error)
        }
    }

    const handleSearch = useCallback(async (val: string) => {
        setQuery(val)
        if (!val.trim()) {
            setResults({ profiles: [], contacts: [], actions: [] })
            setAssistantMessage('Chào bạn! Tôi có thể giúp gì cho bạn hôm nay?')
            return
        }

        setLoading(true)
        try {
            // Search profiles
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, display_name, slug, bio, user_id, user:user_id(avatar_url, username)')
                .or(`display_name.ilike.%${val}%,bio.ilike.%${val}%`)
                .limit(5)

            const filteredActions = actionItems.filter(a =>
                a.name.toLowerCase().includes(val.toLowerCase())
            )

            setResults({
                profiles: profileData || [],
                contacts: [],
                actions: filteredActions
            })

            if (profileData && profileData.length > 0) {
                setAssistantMessage(`Tôi tìm thấy ${profileData.length} kết quả phù hợp với "${val}"!`)
            } else {
                setAssistantMessage(`Xin lỗi, tôi chưa tìm thấy kết quả nào cho "${val}". Thử từ khóa khác nhé?`)
            }

        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    const handleSelection = (href: string, q?: string) => {
        if (q) saveToHistory(q)
        onClose()
        router.push(href)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            <div className="flex min-h-screen items-start justify-center p-4 pt-16 md:pt-32">
                <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                    {/* Search Header */}
                    <div className="relative border-b border-gray-100">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Tìm kiếm chuyên gia, danh bạ, tính năng..."
                            className="w-full pl-16 pr-12 py-6 text-lg font-medium text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {loading ? (
                            <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <button
                                onClick={onClose}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Assistant Message */}
                    <div className="bg-primary-50/50 px-6 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-200">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-primary-700">{assistantMessage}</p>
                    </div>

                    {/* Results Area */}
                    <div className="max-h-[60vh] overflow-y-auto p-4 scrollbar-hide">
                        {!query && (
                            <div className="space-y-6 p-4">
                                {history.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Tìm kiếm gần đây</p>
                                            <button
                                                onClick={clearHistory}
                                                className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest"
                                            >
                                                Xóa tất cả
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {history.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSearch(item.query)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {item.query}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Gợi ý nhanh</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {actionItems.map((item) => {
                                            const Icon = item.icon
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleSelection(item.href, item.name)}
                                                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-primary-50 hover:scale-105 transition-all group border border-transparent hover:border-primary-100 w-full"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:text-primary-600">
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-600 group-hover:text-primary-700 text-center">{item.name}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {query && (
                            <div className="space-y-6">
                                {/* Profiles Section */}
                                {results.profiles.length > 0 && (
                                    <section>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-3">Người dùng & Chuyên gia</p>
                                        <div className="space-y-1">
                                            {results.profiles.map((profile) => (
                                                <button
                                                    key={profile.id}
                                                    onClick={() => handleSelection(`/explore/${profile.slug}`, query)}
                                                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors group w-full text-left"
                                                >
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                                        {profile.user?.avatar_url ? (
                                                            <img src={profile.user.avatar_url} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                                                {profile.display_name?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{profile.display_name}</h4>
                                                        <p className="text-xs text-gray-500 line-clamp-1">{profile.bio || `@${profile.user?.username}`}</p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-all group-hover:translate-x-1" />
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Actions Section */}
                                {results.actions.length > 0 && (
                                    <section>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-3">Chức năng & Lối tắt</p>
                                        <div className="space-y-1">
                                            {results.actions.map((action) => {
                                                const Icon = action.icon
                                                return (
                                                    <button
                                                        key={action.id}
                                                        onClick={() => handleSelection(action.href, query)}
                                                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-primary-50 transition-colors group w-full text-left"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-white flex items-center justify-center group-hover:text-primary-600 transition-colors">
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 text-sm font-bold text-gray-700 group-hover:text-primary-700">{action.name}</div>
                                                        <Badge variant="info" className="text-[10px] text-gray-400 border-gray-200">Lối tắt</Badge>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Command className="w-3 h-3" /> + K</span>
                            <span className="flex items-center gap-1"><Layout className="w-3 h-3" /> Duyệt</span>
                        </div>
                        <div className="text-[10px] font-bold text-primary-500 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Powered
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
