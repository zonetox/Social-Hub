// ============================================
// src/app/(dashboard)/layout.tsx
// ============================================

'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Navbar } from '@/components/dashboard/Navbar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { redirect } from 'next/navigation'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

// ============================================
// src/components/dashboard/Navbar.tsx
// ============================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { 
  Home, 
  User, 
  Settings, 
  Shield, 
  LogOut, 
  Menu, 
  X,
  Search
} from 'lucide-react'

export function Navbar() {
  const { user, signOut, isAdmin } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Hub', href: '/hub', icon: Home },
    { name: 'My Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield })
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/hub" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                Social Hub
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:block">
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">
                  {user?.full_name}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}

                    <div className="border-t border-gray-200 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}

// ============================================
// src/components/dashboard/UserCard.tsx
// ============================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatNumber } from '@/lib/utils/formatting'
import { SOCIAL_PLATFORMS } from '@/lib/utils/constants'
import { 
  Users, 
  Globe, 
  ExternalLink, 
  Heart,
  MapPin,
  Link2,
  CheckCircle
} from 'lucide-react'
import type { Profile } from '@/types/user.types'

interface UserCardProps {
  profile: Profile
  onFollowChange?: () => void
}

export function UserCard({ profile, onFollowChange }: UserCardProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const isOwnProfile = user?.id === profile.user_id
  const visibleAccounts = profile.social_accounts?.filter(acc => acc.is_visible) || []

  const handleFollow = async () => {
    if (!user || isOwnProfile) return

    setIsLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.user_id)
        
        setIsFollowing(false)
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profile.user_id,
          })
        
        setIsFollowing(true)
      }
      
      onFollowChange?.()
    } catch (error) {
      console.error('Follow error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card hover className="overflow-hidden">
      {/* Cover Image */}
      {profile.cover_image_url && (
        <div className="h-32 bg-gradient-to-r from-primary-400 to-secondary-400">
          <img 
            src={profile.cover_image_url} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {!profile.cover_image_url && (
        <div className="h-32 bg-gradient-to-r from-primary-400 to-secondary-400" />
      )}

      <div className="p-6">
        {/* Avatar & Name */}
        <div className="flex items-start justify-between -mt-16 mb-4">
          <div className="flex items-end gap-3">
            {profile.user?.avatar_url ? (
              <img
                src={profile.user.avatar_url}
                alt={profile.display_name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profile.display_name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {!isOwnProfile && user && (
            <Button
              size="sm"
              variant={isFollowing ? 'outline' : 'primary'}
              onClick={handleFollow}
              isLoading={isLoading}
              className="mt-12"
            >
              {isFollowing ? (
                <>
                  <Heart className="w-4 h-4 fill-current" />
                  Following
                </>
              ) : (
                'Follow'
              )}
            </Button>
          )}
        </div>

        {/* User Info */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-gray-900">
              {profile.display_name}
            </h3>
            {profile.user?.is_verified && (
              <CheckCircle className="w-5 h-5 text-primary-600 fill-current" />
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            @{profile.user?.username}
          </p>

          {profile.user?.bio && (
            <p className="text-gray-700 mb-3">{profile.user.bio}</p>
          )}

          {/* Location & Website */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
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
                Website
              </a>
            )}
          </div>

          {/* Tags */}
          {profile.tags && profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.tags.map((tag, index) => (
                <Badge key={index} variant="info">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-4 pb-4 border-b border-gray-200">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {formatNumber(profile.follower_count)}
            </p>
            <p className="text-xs text-gray-600">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {formatNumber(profile.following_count)}
            </p>
            <p className="text-xs text-gray-600">Following</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {formatNumber(visibleAccounts.length)}
            </p>
            <p className="text-xs text-gray-600">Accounts</p>
          </div>
        </div>

        {/* Social Accounts */}
        {visibleAccounts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Social Accounts
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {visibleAccounts.slice(0, 6).map((account) => {
                const platform = SOCIAL_PLATFORMS.find(
                  p => p.name === account.platform
                )
                return (
                  <a
                    key={account.id}
                    href={account.platform_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: platform?.color }}
                    >
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 truncate">
                        {account.platform}
                      </p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {account.platform_username}
                      </p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-primary-600" />
                  </a>
                )
              })}
            </div>
            
            {visibleAccounts.length > 6 && (
              <Link
                href={`/${profile.slug}`}
                className="block text-center mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all {visibleAccounts.length} accounts →
              </Link>
            )}
          </div>
        )}

        {/* View Profile Button */}
        <Link href={`/${profile.slug}`} className="block mt-4">
          <Button variant="outline" size="sm" className="w-full">
            View Full Profile
          </Button>
        </Link>
      </div>
    </Card>
  )
}