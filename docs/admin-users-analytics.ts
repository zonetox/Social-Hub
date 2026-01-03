// ============================================
// src/app/(dashboard)/admin/users/page.tsx
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/lib/utils/formatting'
import { 
  Search, 
  MoreVertical, 
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Eye
} from 'lucide-react'
import { redirect } from 'next/navigation'
import type { User } from '@/types/user.types'

export default function AdminUsersPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      redirect('/hub')
    }
  }, [authLoading, isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(users)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = users.filter(user =>
      user.full_name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
      setFilteredUsers(data || [])
    } catch (error) {
      console.error('Fetch users error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('users')
        .update({ is_verified: !currentStatus })
        .eq('id', userId)

      fetchUsers()
      setShowActionMenu(null)
    } catch (error) {
      console.error('Toggle verification error:', error)
    }
  }

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      fetchUsers()
      setShowActionMenu(null)
    } catch (error) {
      console.error('Toggle active error:', error)
    }
  }

  const handleMakeAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to make this user an admin?')) return

    try {
      await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', userId)

      fetchUsers()
      setShowActionMenu(null)
    } catch (error) {
      console.error('Make admin error:', error)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage all users on the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Active Users</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.is_active).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Verified Users</p>
          <p className="text-2xl font-bold text-primary-600">
            {users.filter(u => u.is_verified).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Admins</p>
          <p className="text-2xl font-bold text-secondary-600">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {user.full_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          {user.is_verified && (
                            <CheckCircle className="w-4 h-4 text-primary-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{user.email}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="danger">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === 'admin' ? (
                      <Badge variant="info">Admin</Badge>
                    ) : (
                      <Badge variant="default">User</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>

                      {showActionMenu === user.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowActionMenu(null)}
                          />
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                              onClick={() => window.open(`/${user.username}`, '_blank')}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Eye className="w-4 h-4" />
                              View Profile
                            </button>
                            
                            <button
                              onClick={() => handleToggleVerification(user.id, user.is_verified)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {user.is_verified ? (
                                <>
                                  <XCircle className="w-4 h-4" />
                                  Remove Verification
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Verify User
                                </>
                              )}
                            </button>

                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleMakeAdmin(user.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Shield className="w-4 h-4" />
                                Make Admin
                              </button>
                            )}

                            <div className="border-t border-gray-200 my-1" />

                            <button
                              onClick={() => handleToggleActive(user.id, user.is_active)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Ban className="w-4 h-4" />
                              {user.is_active ? 'Deactivate User' : 'Activate User'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// ============================================
// src/app/(dashboard)/admin/analytics/page.tsx
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
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

      // Fetch profile views
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*, user:users(username), social_accounts(click_count)')

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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
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