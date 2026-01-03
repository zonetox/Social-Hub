// @ts-nocheck
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Profile } from '@/types/user.types'

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    profile: Profile
    onUpdate: () => void
}

export function EditProfileModal({
    isOpen,
    onClose,
    profile,
    onUpdate
}: EditProfileModalProps) {
    const [formData, setFormData] = useState({
        display_name: profile.display_name,
        bio: profile.user?.bio || '',
        location: profile.location || '',
        website: profile.website || '',
    })
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // @ts-ignore
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: formData.display_name,
                    bio: formData.bio,
                    location: formData.location,
                    website: formData.website,
                } as any)
                .eq('id', profile.id)

            if (error) throw error

            // Also update user table for redundant data if needed
            // @ts-ignore
            await supabase
                .from('users')
                .update({
                    full_name: formData.display_name,
                    bio: formData.bio,
                } as any)
                .eq('id', profile.user_id)

            onUpdate()
            onClose()
        } catch (error) {
            console.error('Update profile error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Profile"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Display Name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                />

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    />
                </div>

                <Input
                    label="Location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />

                <Input
                    label="Website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
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
                        className="flex-1"
                        isLoading={isLoading}
                    >
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
