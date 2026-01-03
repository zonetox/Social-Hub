// ============================================
// src/app/(dashboard)/hub/page.tsx
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCard } from '@/components/dashboard/UserCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Input } from '@/components/ui/Input'
import { Search, Users } from 'lucide-react'
import type { Profile } from '@/types/user.types'

export default function HubPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchProfiles()
  }, [])

  useEffect(() => {
    if (!searchQuery) {
      setFilteredProfiles(profiles)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = profiles.filter(profile => 
      profile.display_name.toLowerCase().includes(query) ||
      profile.user?.username.toLowerCase().includes(query) ||
      profile.user?.bio?.toLowerCase().includes(query) ||
      profile.tags?.some(tag => tag.toLowerCase().includes(query))
    )
    setFilteredProfiles(filtered)
  }, [searchQuery, profiles])

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user:users(*),
          social_accounts(*)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Sort social accounts for each profile
      data?.forEach(profile => {
        if (profile.social_accounts) {
          profile.social_accounts.sort((a, b) => a.display_order - b.display_order)
        }
      })

      setProfiles(data || [])
      setFilteredProfiles(data || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Discover Creators
        </h1>
        <p className="text-gray-600">
          Connect with {profiles.length} creators and follow all their social accounts in one click
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, username, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
              <p className="text-sm text-gray-600">Total Creators</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredProfiles.length}</p>
              <p className="text-sm text-gray-600">Search Results</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {profiles.reduce((sum, p) => sum + (p.social_accounts?.length || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Total Accounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profiles Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No profiles found
          </h3>
          <p className="text-gray-600">
            {searchQuery 
              ? 'Try adjusting your search query' 
              : 'Be the first to create a profile!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map(profile => (
            <UserCard 
              key={profile.id} 
              profile={profile}
              onFollowChange={fetchProfiles}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// src/app/(dashboard)/profile/page.tsx
// ============================================

'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useProfile } from '@/lib/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { SocialAccountsList } from '@/components/profile/SocialAccountsList'
import { AddSocialAccountModal } from '@/components/profile/AddSocialAccountModal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const { profile, loading, refreshProfile } = useProfile(user?.id)
  const [showAddModal, setShowAddModal] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Profile Not Found
        </h2>
        <p className="text-gray-600">Unable to load your profile</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ProfileHeader profile={profile} onUpdate={refreshProfile} />

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Social Accounts
          </h2>
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>

        <SocialAccountsList 
          accounts={profile.social_accounts || []}
          onUpdate={refreshProfile}
        />
      </div>

      <AddSocialAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        profileId={profile.id}
        onSuccess={() => {
          setShowAddModal(false)
          refreshProfile()
        }}
      />
    </div>
  )
}

// ============================================
// src/components/profile/ProfileHeader.tsx
// ============================================

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { formatNumber } from '@/lib/utils/formatting'
import { profileSchema } from '@/lib/utils/validation'
import { 
  Edit2, 
  MapPin, 
  Link2, 
  Globe, 
  CheckCircle,
  Share2
} from 'lucide-react'
import type { Profile } from '@/types/user.types'

interface ProfileHeaderProps {
  profile: Profile
  onUpdate: () => void
}

export function ProfileHeader({ profile, onUpdate }: ProfileHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    display_name: profile.display_name,
    bio: profile.user?.bio || '',
    website: profile.website || '',
    location: profile.location || '',
    tags: profile.tags?.join(', ') || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    const result = profileSchema.safeParse({
      ...formData,
      tags,
    })

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
      // Update profile
      await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          website: formData.website || null,
          location: formData.location || null,
          tags: tags.length > 0 ? tags : null,
        })
        .eq('id', profile.id)

      // Update user bio
      await supabase
        .from('users')
        .update({
          bio: formData.bio || null,
        })
        .eq('id', profile.user_id)

      setIsEditModalOpen(false)
      onUpdate()
    } catch (error) {
      console.error('Update error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/${profile.slug}`
    try {
      await navigator.clipboard.writeText(url)
      alert('Profile link copied to clipboard!')
    } catch (error) {
      alert(`Share this link: ${url}`)
    }
  }

  return (
    <>
      <Card>
        {/* Cover Image */}
        {profile.cover_image_url && (
          <div className="h-48 bg-gradient-to-r from-primary-400 to-secondary-400">
            <img 
              src={profile.cover_image_url} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {!profile.cover_image_url && (
          <div className="h-48 bg-gradient-to-r from-primary-400 to-secondary-400" />
        )}

        <div className="p-6">
          <div className="flex items-start justify-between -mt-20 mb-4">
            <div className="flex items-end gap-4">
              {profile.user?.avatar_url ? (
                <img
                  src={profile.user.avatar_url}
                  alt={profile.display_name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {profile.display_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-20">
              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.display_name}
              </h1>
              {profile.user?.is_verified && (
                <CheckCircle className="w-6 h-6 text-primary-600 fill-current" />
              )}
            </div>
            
            <p className="text-gray-600 mb-3">@{profile.user?.username}</p>

            {profile.user?.bio && (
              <p className="text-gray-700 mb-4">{profile.user.bio}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </div>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                >
                  <Link2 className="w-4 h-4" />
                  {new URL(profile.website).hostname}
                </a>
              )}
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {profile.is_public ? 'Public Profile' : 'Private Profile'}
              </div>
            </div>

            {profile.tags && profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.tags.map((tag, index) => (
                  <Badge key={index} variant="info">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-6 pt-4 border-t border-gray-200">
              <div>
                <span className="text-xl font-bold text-gray-900">
                  {formatNumber(profile.follower_count)}
                </span>
                <span className="text-gray-600 ml-1">Followers</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">
                  {formatNumber(profile.following_count)}
                </span>
                <span className="text-gray-600 ml-1">Following</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">
                  {formatNumber(profile.view_count)}
                </span>
                <span className="text-gray-600 ml-1">Views</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display Name"
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            error={errors.display_name}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/160 characters
            </p>
            {errors.bio && (
              <p className="text-sm text-red-600 mt-1">{errors.bio}</p>
            )}
          </div>

          <Input
            label="Website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            error={errors.website}
            placeholder="https://example.com"
          />

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            error={errors.location}
            placeholder="City, Country"
          />

          <Input
            label="Tags"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            error={errors.tags}
            placeholder="tech, design, photography (comma separated)"
            helperText="Maximum 5 tags"
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
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
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// ============================================
// IMPORTANT: Continue in next artifact for remaining components
// (SocialAccountsList, AddSocialAccountModal, Admin Panel)
// ============================================