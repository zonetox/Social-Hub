'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'
import { RequestCard } from '@/components/marketplace/RequestCard'
import { Button } from '@/components/ui/Button'
import { Plus, Search, Filter, ArrowUpDown, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DashboardErrorState } from '@/components/dashboard/DashboardStates'

export default function RequestsPage() {
    const { user } = useAuth()
    const supabase = createClient()

    const [requests, setRequests] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(0)
    const PAGE_SIZE = 12

    // Filters
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest')

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('profile_categories')
                .select('*')
                .order('name')
            if (data) setCategories(data)
        }
        fetchCategories()
    }, [])

    const fetchRequests = async (currentPage: number, isNewSearch: boolean = false) => {
        if (isNewSearch) {
            setLoading(true)
            setError(null)
            setPage(0)
        } else {
            setLoadingMore(true)
        }

        try {
            let query = supabase
                .from('service_requests')
                .select(`
                    *,
                    category:profile_categories(name, icon, slug)
                `, { count: 'exact' })

            // Apply Filters
            if (search) {
                query = query.ilike('title', `%${search}%`)
            }
            if (selectedCategory !== 'all') {
                query = query.eq('category_id', selectedCategory)
            }

            // Apply Sorting
            if (sortBy === 'newest') {
                query = query.order('created_at', { ascending: false })
            } else {
                // Approximate popularity by offers_count if available
                query = query.order('offers_count', { ascending: false })
            }

            // Pagination
            const from = currentPage * PAGE_SIZE
            const to = from + PAGE_SIZE - 1
            query = query.range(from, to)

            const { data, count, error: fetchError } = await query

            if (fetchError) throw fetchError

            if (data) {
                if (isNewSearch) {
                    setRequests(data)
                } else {
                    setRequests(prev => [...prev, ...data])
                }
                setHasMore(count ? (currentPage + 1) * PAGE_SIZE < count : false)
            }
        } catch (err: any) {
            console.error('Error fetching requests:', err)
            setError(err.message || 'Không thể tải danh sách yêu cầu.')
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    // Effect for filtering/sorting
    useEffect(() => {
        fetchRequests(0, true)
    }, [search, selectedCategory, sortBy])

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        fetchRequests(nextPage, false)
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50/50 pt-12">
                <DashboardErrorState
                    message={error}
                    onRetry={() => fetchRequests(0, true)}
                />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Hero Section */}
            <div className="bg-white border-b border-gray-100 py-12 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Sàn Cơ Hội</h1>
                            <p className="text-gray-500 text-lg font-medium">Kết nối doanh nghiệp với hàng ngàn yêu cầu dịch vụ mỗi ngày.</p>
                        </div>
                        <Link href="/requests/create">
                            <Button size="lg" className="premium-gradient border-none shadow-xl shadow-primary-500/20 text-white font-black px-8 rounded-2xl scale-105 hover:scale-110 transition-transform">
                                <Plus className="w-5 h-5 mr-2" />
                                Đăng yêu cầu ngay
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 mb-8 sticky top-24 z-30 backdrop-blur-md bg-white/80">
                    <div className="flex-grow relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm yêu cầu..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary-500/10 transition-all font-medium text-gray-700"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-transparent focus-within:border-primary-100 transition-colors">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 outline-none"
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">Tất cả ngành nghề</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl">
                            <ArrowUpDown className="w-4 h-4 text-gray-400" />
                            <select
                                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 outline-none"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as any)}
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="popular">Phổ biến nhất</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading && page === 0 ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-gray-100 shadow-sm animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Search className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Không tìm thấy kết quả</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-10 font-medium">
                            Chúng tôi không tìm thấy yêu cầu nào phù hợp với từ khóa hoặc bộ lọc của bạn. Thử thay đổi các tùy chọn tìm kiếm nhé!
                        </p>
                        <Button
                            variant="outline"
                            className="rounded-2xl px-8 font-black border-gray-200"
                            onClick={() => {
                                setSearch('')
                                setSelectedCategory('all')
                                setSortBy('newest')
                            }}
                        >
                            Xóa bộ lọc
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {requests.map((req, idx) => (
                                <div
                                    key={req.id}
                                    className="animate-in fade-in slide-in-from-bottom duration-500"
                                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                                >
                                    <RequestCard
                                        request={req}
                                        isOwner={user?.id === req.created_by_user_id}
                                    />
                                </div>
                            ))}
                        </div>

                        {hasMore && (
                            <div className="mt-16 flex justify-center">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="rounded-2xl px-12 font-black border-2 border-primary-100 text-primary-600 hover:bg-primary-50 transition-all h-14"
                                    onClick={handleLoadMore}
                                    isLoading={loadingMore}
                                >
                                    Xem thêm cơ hội
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
