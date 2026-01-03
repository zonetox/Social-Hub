// ============================================
// src/components/profile/SocialAccountsList.tsx
// ============================================

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SOCIAL_PLATFORMS } from '@/lib/utils/constants'
import { 
  ExternalLink, 
  Trash2, 
  Eye, 
  EyeOff,
  GripVertical,
  BarChart3
} from 'lucide-react'
import type { SocialAccount } from '@/types/user.types'

interface SocialAccountsListProps {
  accounts: SocialAccount[]
  onUpdate: () => void
}

export function SocialAccountsList({ accounts, onUpdate }: SocialAccountsListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const supabase = createClient()

  const handleToggleVisibility = async (accountId: string, currentVisibility: boolean) => {
    try {
      await supabase
        .from('social_accounts')
        .update({ is_visible: !currentVisibility })
        .eq('id', accountId)
      
      onUpdate()
    } catch (error) {
      console.error('Toggle visibility error:', error)
    }
  }

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    setIsDeleting(accountId)
    try {
      await supabase
        .from('social_accounts')
        .delete()
        .eq('id', accountId)
      
      onUpdate()
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setIsDeleting(null)
    }
  }

  if (accounts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-gray-400 mb-4">
          <ExternalLink className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No social accounts yet
        </h3>
        <p className="text-gray-600">
          Add your first social media account to get started
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => {
        const platform = SOCIAL_PLATFORMS.find(p => p.name === account.platform)
        
        return (
          <Card key={account.id} className="p-4">
            <div className="flex items-center gap-4">
              {/* Drag Handle */}
              <button className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                <GripVertical className="w-5 h-5" />
              </button>

              {/* Platform Icon */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: platform?.color || '#6B7280' }}
              >
                <span className="text-xl font-bold">
                  {account.platform.charAt(0)}
                </span>
              </div>

              {/* Account Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900">
                  {account.platform}
                </h4>
                <p className="text-sm text-gray-600 truncate">
                  @{account.platform_username}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BarChart3 className="w-4 h-4" />
                <span>{account.click_count} clicks</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleVisibility(account.id, account.is_visible)}
                  title={account.is_visible ? 'Hide' : 'Show'}
                >
                  {account.is_visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </Button>

                <a
                  href={account.platform_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(account.id)}
                  disabled={isDeleting === account.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ============================================
// src/components/profile/AddSocialAccountModal.tsx
// ============================================

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SOCIAL_PLATFORMS } from '@/lib/utils/constants'
import { socialAccountSchema } from '@/lib/utils/validation'

interface AddSocialAccountModalProps {
  isOpen: boolean
  onClose: () => void
  profileId: string
  onSuccess: () => void
}

export function AddSocialAccountModal({ 
  isOpen, 
  onClose, 
  profileId, 
  onSuccess 
}: AddSocialAccountModalProps) {
  const [formData, setFormData] = useState({
    platform: SOCIAL_PLATFORMS[0].name,
    platform_username: '',
    platform_url: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const selectedPlatform = SOCIAL_PLATFORMS.find(p => p.name === formData.platform)

  const handlePlatformChange = (platformName: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.name === platformName)
    setFormData(prev => ({
      ...prev,
      platform: platformName,
      platform_url: platform?.urlPattern + prev.platform_username || '',
    }))
  }

  const handleUsernameChange = (username: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.name === formData.platform)
    setFormData(prev => ({
      ...prev,
      platform_username: username,
      platform_url: platform?.urlPattern + username || '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = socialAccountSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    try {
      // Get current max display_order
      const { data: accounts } = await supabase
        .from('social_accounts')
        .select('display_order')
        .eq('profile_id', profileId)
        .order('display_order', { ascending: false })
        .limit(1)

      const maxOrder = accounts?.[0]?.display_order || 0

      await supabase
        .from('social_accounts')
        .insert({
          profile_id: profileId,
          platform: formData.platform,
          platform_username: formData.platform_username,
          platform_url: formData.platform_url,
          display_order: maxOrder + 1,
        })

      onSuccess()
      setFormData({
        platform: SOCIAL_PLATFORMS[0].name,
        platform_username: '',
        platform_url: '',
      })
    } catch (error) {
      console.error('Add account error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Social Account"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform
          </label>
          <select
            value={formData.platform}
            onChange={(e) => handlePlatformChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {SOCIAL_PLATFORMS.map(platform => (
              <option key={platform.name} value={platform.name}>
                {platform.name}
              </option>
            ))}
          </select>
        </div>

        {selectedPlatform && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: selectedPlatform.color }}
              >
                <span className="text-lg font-bold">
                  {selectedPlatform.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {selectedPlatform.name}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedPlatform.urlPattern}
                </p>
              </div>
            </div>
          </div>
        )}

        <Input
          label="Username"
          value={formData.platform_username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          error={errors.platform_username}
          placeholder="your_username"
        />

        <Input
          label="Full URL"
          type="url"
          value={formData.platform_url}
          onChange={(e) => setFormData(prev => ({ ...prev, platform_url: e.target.value }))}
          error={errors.platform_url}
          placeholder="https://..."
          helperText="The full URL to your profile"
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="flex-1"
          >
            Add Account
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ============================================
// src/app/(dashboard)/admin/page.tsx
// ============================================

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