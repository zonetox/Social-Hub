// @ts-nocheck
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SOCIAL_PLATFORMS } from '@/lib/utils/constants'
import { socialAccountSchema } from '@/lib/utils/validation'
import { DynamicIcon } from '@/components/shared/DynamicIcon'

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
                .limit(1) as any as { data: any[] }

            const maxOrder = accounts?.[0]?.display_order || 0

            await supabase
                .from('social_accounts')
                .insert({
                    profile_id: profileId,
                    platform: formData.platform,
                    platform_username: formData.platform_username,
                    platform_url: formData.platform_url,
                    display_order: maxOrder + 1,
                } as any)

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
                                <DynamicIcon name={selectedPlatform.icon} className="w-6 h-6" />
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
