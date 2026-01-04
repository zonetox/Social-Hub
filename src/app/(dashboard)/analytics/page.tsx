'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatNumber } from '@/lib/utils/formatting'
import {
    BarChart3,
    TrendingUp,
    MousePointer2,
    Send,
    Users,
    Eye,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react'

export default function AnalyticsPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [chartData, setChartData] = useState<any[]>([])
    const [days, setDays] = useState(7)
    const supabase = createClient()

    useEffect(() => {
        if (user) {
            fetchAnalytics()
        }
    }, [user, days])

    const fetchAnalytics = async () => {
        if (!user) return

        try {
            // Get profile for its ID
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single() as any

            if (!profile) return

            // Get historical data from our new API
            const response = await fetch(`/api/analytics?profileId=${profile.id}&days=${days}`)
            const historical = await response.json()

            // Get card send stats (separately as it's not in analytics table yet)
            const { data: sentCards } = await supabase
                .from('card_sends')
                .select('*')
                .eq('sender_id', user.id) as any

            // Calculate stats
            const totalViews = profile.view_count || 0
            const totalClicks = historical.summary?.totalClicks || 0
            const totalSent = sentCards?.length || 0
            const totalViewed = sentCards?.filter((c: any) => c.viewed).length || 0
            const cardSuccessRate = totalSent > 0 ? Math.round((totalViewed / totalSent) * 100) : 0

            setStats({
                profileViews: totalViews,
                followers: profile.follower_count || 0,
                clicks: totalClicks,
                sentCards: totalSent,
                cardSuccessRate,
                ctr: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0
            })

            setChartData(historical.chartData || [])
        } catch (error) {
            console.error('Analytics error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    // Helper to get max value for chart scaling
    const maxVal = Math.max(...chartData.map(d => d.views + d.clicks), 1)

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-black text-gray-900 mb-2">Performance</h1>
                <p className="text-gray-600">Track your digital presence and connection performance</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <Card className="p-6 bg-white shadow-xl border-gray-100 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-primary-50 rounded-2xl text-primary-600">
                            <Eye className="w-6 h-6" />
                        </div>
                        <div className="flex items-center text-green-600 font-bold text-sm">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            +12%
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Profile Reach</p>
                    <p className="text-4xl font-black text-gray-900">{formatNumber(stats.profileViews)}</p>
                    <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Eye className="w-24 h-24" />
                    </div>
                </Card>

                <Card className="p-6 bg-white shadow-xl border-gray-100 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <MousePointer2 className="w-6 h-6" />
                        </div>
                        <div className="flex items-center text-green-600 font-bold text-sm">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            +5%
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Link Interactions</p>
                    <p className="text-4xl font-black text-gray-900">{formatNumber(stats.clicks)}</p>
                    <p className="text-xs font-bold text-gray-400 mt-2">{stats.ctr}% CTR</p>
                </Card>

                <Card className="p-6 bg-white shadow-xl border-gray-100 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                            <Send className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Cards Shared</p>
                    <p className="text-4xl font-black text-gray-900">{stats.sentCards}</p>
                    <p className="text-xs font-bold text-purple-600 mt-2">{stats.cardSuccessRate}% Acceptance</p>
                </Card>

                <Card className="p-6 bg-white shadow-xl border-gray-100 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="flex items-center text-red-600 font-bold text-sm">
                            <ArrowDownRight className="w-4 h-4 mr-1" />
                            -2%
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Active Fans</p>
                    <p className="text-4xl font-black text-gray-900">{formatNumber(stats.followers)}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Area */}
                <Card className="lg:col-span-2 p-8 bg-white shadow-xl border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary-500" />
                            Engagement Over Time
                        </h3>
                        <div className="flex p-1 bg-gray-50 rounded-xl">
                            <button
                                onClick={() => setDays(7)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${days === 7 ? 'text-gray-900 bg-white shadow-sm' : 'text-gray-500'}`}
                            >
                                7D
                            </button>
                            <button
                                onClick={() => setDays(30)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${days === 30 ? 'text-gray-900 bg-white shadow-sm' : 'text-gray-500'}`}
                            >
                                30D
                            </button>
                        </div>
                    </div>

                    <div className="h-64 flex items-end gap-2 px-4 border-b border-gray-50 pb-2">
                        {chartData.map((day, i) => (
                            <div
                                key={i}
                                className="flex-1 flex flex-col justify-end gap-0.5 group relative"
                            >
                                <div
                                    className="w-full bg-secondary-400/30 rounded-t-sm transition-all hover:bg-secondary-400/50"
                                    style={{ height: `${(day.clicks / maxVal) * 100}%` }}
                                />
                                <div
                                    className="w-full bg-primary-500 rounded-t-sm transition-all hover:bg-primary-600"
                                    style={{ height: `${(day.views / maxVal) * 100}%` }}
                                />

                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-2 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow-xl">
                                    <p className="font-bold border-b border-white/10 mb-1 pb-1">{day.date}</p>
                                    <p>Views: {day.views}</p>
                                    <p>Clicks: {day.clicks}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>{chartData[0]?.date}</span>
                        <span>{chartData[Math.floor(chartData.length / 2)]?.date}</span>
                        <span>{chartData[chartData.length - 1]?.date}</span>
                    </div>
                </Card>

                {/* Feature Suggestion */}
                <Card className="p-8 premium-gradient text-white border-none shadow-2xl flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 leading-tight">Grow Your Audience</h3>
                        <p className="text-white/80 font-medium mb-6">
                            Upgrade to Premium Business to see detailed geographic data and individual link click summaries.
                        </p>
                    </div>
                    <button className="w-full py-4 bg-white text-primary-600 rounded-2xl font-black shadow-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 group">
                        Upgrade Now
                        <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </button>
                </Card>
            </div>
        </div>
    )
}
