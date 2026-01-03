// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatNumber } from '@/lib/utils/formatting'
import {
    Users,
    Globe,
    Eye,
    Activity,
    TrendingUp,
    UserPlus,
    Link as LinkIcon
} from 'lucide-react'
import { redirect } from 'next/navigation'

export default function AdminPage() {
    const { user, isAdmin, loading: authLoading } = useAuth()
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProfiles: 0,
        totalSocialAccounts: 0,
        totalViews: 0,
        totalFollows: 0,
        newUsersThisWeek: 0,
    })
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            redirect('/hub')
        }
    }, [authLoading, isAdmin])

    useEffect(() => {
        if (isAdmin) {
            fetchStats()
        }
    }, [isAdmin])

    const fetchStats = async () => {
        try {
            // Fetch counts
            const [
                usersResult,
                profilesResult,
                accountsResult,
                followsResult,
                newUsersResult,
            ] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('social_accounts').select('*', { count: 'exact', head: true }),
                supabase.from('follows').select('*', { count: 'exact', head: true }),
                supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
            ])

            // Get total views from profiles
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('view_count')
                .returns<{ view_count: number }[]>()

            const totalViews = profilesData?.reduce((sum, p) => sum + p.view_count, 0) || 0

            setStats({
                totalUsers: usersResult.count || 0,
                totalProfiles: profilesResult.count || 0,
                totalSocialAccounts: accountsResult.count || 0,
                totalViews,
                totalFollows: followsResult.count || 0,
                newUsersThisWeek: newUsersResult.count || 0,
            })
        } catch (error) {
            console.error('Fetch stats error:', error)
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

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Admin Dashboard
                </h1>
                <p className="text-gray-600">
                    Overview of platform statistics and management
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {formatNumber(stats.totalUsers)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">New Users (7d)</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {formatNumber(stats.newUsersThisWeek)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <UserPlus className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Public Profiles</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {formatNumber(stats.totalProfiles)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                            <Globe className="w-6 h-6 text-secondary-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Social Accounts</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {formatNumber(stats.totalSocialAccounts)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <LinkIcon className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Views</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {formatNumber(stats.totalViews)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Eye className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Follows</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {formatNumber(stats.totalFollows)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/admin/users"
                        className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                        <Users className="w-6 h-6 text-primary-600 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-1">Manage Users</h3>
                        <p className="text-sm text-gray-600">
                            View, edit, and manage all user accounts
                        </p>
                    </a>

                    <a
                        href="/admin/analytics"
                        className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                        <TrendingUp className="w-6 h-6 text-primary-600 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
                        <p className="text-sm text-gray-600">
                            View detailed platform analytics and insights
                        </p>
                    </a>

                    <a
                        href="/hub"
                        className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                        <Globe className="w-6 h-6 text-primary-600 mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-1">View Hub</h3>
                        <p className="text-sm text-gray-600">
                            Browse all public profiles on the platform
                        </p>
                    </a>
                </div>
            </Card>
        </div>
    )
}
