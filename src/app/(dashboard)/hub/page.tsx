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
                .returns<Profile[]>()

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
