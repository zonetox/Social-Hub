// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import type { Database } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatNumber, formatDate } from '@/lib/utils/formatting'
import {
    TrendingUp,
    Users,
    Eye,
    MousePointer,
    Heart,
    Share2,
    Calendar
} from 'lucide-react'
import { redirect } from 'next/navigation'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts'

interface AnalyticsData {
    totalViews: number
    totalClicks: number
    totalFollows: number
    totalShares: number
    viewsThisWeek: number
    clicksThisWeek: number
    dailyStats: Array<{
        date: string
        views: number
        clicks: number
        follows: number
    }>
    topProfiles: Array<{
        display_name: string
        username: string
        views: number
        clicks: number
    }>
}

export default function AdminAnalyticsPage() {
    const { isAdmin, loading: authLoading } = useAuth()
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
    const supabase = createClient()

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            redirect('/hub')
        }
    }, [authLoading, isAdmin])

    useEffect(() => {
        if (isAdmin) {
            fetchAnalytics()
        }
    }, [isAdmin, timeRange])

    const fetchAnalytics = async () => {
        try {
            const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
            const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

            // Fetch analytics events
            const { data: events } = await supabase
                .from('analytics')
                .select('*')
                .gte('created_at', startDate.toISOString())
                .returns<Database['public']['Tables']['analytics']['Row'][]>()

            interface ProfileWithRelations {
                id: string
                display_name: string
                view_count: number
                user: { username: string }
                social_accounts: { click_count: number }[]
            }

            // Fetch profile views
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*, user:users(username), social_accounts(click_count)')
                .returns<ProfileWithRelations[]>()

            // Calculate stats
            const totalViews = events?.filter(e => e.event_type === 'view').length || 0
            const totalClicks = events?.filter(e => e.event_type === 'click').length || 0
            const totalFollows = events?.filter(e => e.event_type === 'follow').length || 0
            const totalShares = events?.filter(e => e.event_type === 'share').length || 0

            const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            const viewsThisWeek = events?.filter(
                e => e.event_type === 'view' && new Date(e.created_at) > last7Days
            ).length || 0
            const clicksThisWeek = events?.filter(
                e => e.event_type === 'click' && new Date(e.created_at) > last7Days
            ).length || 0

            // Daily stats
            const dailyStatsMap = new Map()
            for (let i = daysAgo - 1; i >= 0; i--) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
                const dateStr = date.toISOString().split('T')[0]
                dailyStatsMap.set(dateStr, { date: dateStr, views: 0, clicks: 0, follows: 0 })
            }

            events?.forEach(event => {
                const dateStr = event.created_at.split('T')[0]
                if (dailyStatsMap.has(dateStr)) {
                    const stats = dailyStatsMap.get(dateStr)
                    if (event.event_type === 'view') stats.views++
                    if (event.event_type === 'click') stats.clicks++
                    if (event.event_type === 'follow') stats.follows++
                }
            })

            const dailyStats = Array.from(dailyStatsMap.values())

            // Top profiles
            const topProfiles = profiles
                ?.map(p => ({
                    display_name: p.display_name,
                    username: p.user.username,
                    views: p.view_count,
                    clicks: p.social_accounts?.reduce((sum, acc) => sum + acc.click_count, 0) || 0
                }))
                .sort((a, b) => b.views - a.views)
                .slice(0, 10) || []

            setAnalytics({
                totalViews,
                totalClicks,
                totalFollows,
                totalShares,
                viewsThisWeek,
                clicksThisWeek,
                dailyStats,
                topProfiles,
            })
        } catch (error) {
            console.error('Fetch analytics error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!analytics) return null

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
                    <p className="text-gray-600">Platform performance and insights</p>
                </div>

                <div className="flex gap-2">
                    {(['7d', '30d', '90d'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Eye className="w-6 h-6 text-primary-600" />
                        </div>
                        <span className="text-sm text-green-600 font-medium">
                            +{formatNumber(analytics.viewsThisWeek)} this week
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        {formatNumber(analytics.totalViews)}
                    </p>
                    <p className="text-sm text-gray-600">Total Profile Views</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                            <MousePointer className="w-6 h-6 text-secondary-600" />
                        </div>
                        <span className="text-sm text-green-600 font-medium">
                            +{formatNumber(analytics.clicksThisWeek)} this week
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        {formatNumber(analytics.totalClicks)}
                    </p>
                    <p className="text-sm text-gray-600">Social Account Clicks</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <Heart className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        {formatNumber(analytics.totalFollows)}
                    </p>
                    <p className="text-sm text-gray-600">Total Follows</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Share2 className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        {formatNumber(analytics.totalShares)}
                    </p>
                    <p className="text-sm text-gray-600">Profile Shares</p>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.dailyStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="views" stroke="#0ea5e9" name="Views" />
                            <Line type="monotone" dataKey="clicks" stroke="#d946ef" name="Clicks" />
                            <Line type="monotone" dataKey="follows" stroke="#10b981" name="Follows" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top Profiles</h3>
                    <div className="space-y-3">
                        {analytics.topProfiles.slice(0, 5).map((profile, index) => (
                            <div key={profile.username} className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-gray-400 w-8">
                                    #{index + 1}
                                </span>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{profile.display_name}</p>
                                    <p className="text-sm text-gray-500">@{profile.username}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                        {formatNumber(profile.views)} views
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatNumber(profile.clicks)} clicks
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )
}
