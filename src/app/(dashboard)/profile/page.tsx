'use client'

export const dynamic = 'force-dynamic'

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
    const { user, loading: authLoading } = useAuth()
    const { profile, loading: profileLoading, refreshProfile } = useProfile(user?.id)
    const [showAddModal, setShowAddModal] = useState(false)

    if (authLoading || profileLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!user) {
        return null // Should be handled by layout
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
