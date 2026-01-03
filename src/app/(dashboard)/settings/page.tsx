// @ts-nocheck
'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useProfile } from '@/lib/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import {
    User,
    Mail,
    Lock,
    Globe,
    Bell,
    Shield,
    Trash2,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle,
    Upload
} from 'lucide-react'

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth()
    const { profile, loading: profileLoading, refreshProfile } = useProfile(user?.id)
    const [activeTab, setActiveTab] = useState<'account' | 'profile' | 'privacy' | 'security'>('account')

    if (authLoading || profileLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!user) {
        return null // Should be handled by layout, but defensive here
    }

    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'profile', label: 'Profile', icon: Globe },
        { id: 'privacy', label: 'Privacy', icon: Shield },
        { id: 'security', label: 'Security', icon: Lock },
    ]

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tabs Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="p-2">
                        <nav className="space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </nav>
                    </Card>
                </div>

                {/* Content */}
                <div className="lg:col-span-3 space-y-6">
                    {activeTab === 'account' && <AccountSettings user={user!} />}
                    {activeTab === 'profile' && <ProfileSettings profile={profile!} onUpdate={refreshProfile} />}
                    {activeTab === 'privacy' && <PrivacySettings profile={profile!} onUpdate={refreshProfile} />}
                    {activeTab === 'security' && <SecuritySettings />}
                </div>
            </div>
        </div>
    )
}

function AccountSettings({ user }: { user: any }) {
    const [formData, setFormData] = useState({
        full_name: user.full_name,
        email: user.email,
        username: user.username,
    })
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess(false)

        try {
            // Update user
            const { error: updateError } = await supabase
                .from('users')
                // @ts-ignore
                .update({
                    full_name: formData.full_name,
                    username: formData.username,
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="p-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Account Information</h2>
                <p className="text-sm text-gray-600">Update your account details</p>
            </div>

            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">Account updated successfully!</p>
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Full Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                />

                <Input
                    label="Username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    helperText="Your unique username for your profile URL"
                />

                <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    disabled
                    helperText="Contact support to change your email"
                />

                <div className="pt-4">
                    <Button type="submit" isLoading={isLoading}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </Card>
    )
}

function ProfileSettings({ profile, onUpdate }: { profile: any, onUpdate: () => void }) {
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const supabase = createClient()

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile.user_id}/avatar.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            await supabase
                .from('users')
                // @ts-ignore
                .update({ avatar_url: publicUrl } as any)
                .eq('id', profile.user_id)

            onUpdate()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile.user_id}/cover.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('covers')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('covers')
                .getPublicUrl(fileName)

            await supabase
                .from('profiles')
                // @ts-ignore
                .update({ cover_image_url: publicUrl } as any)
                .eq('id', profile.id)

            onUpdate()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Avatar Upload */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Picture</h2>
                <div className="flex items-center gap-6">
                    {profile.user?.avatar_url ? (
                        <img
                            src={profile.user.avatar_url}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">
                                {profile.display_name.charAt(0)}
                            </span>
                        </div>
                    )}

                    <div>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                            <span className="inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 px-3 py-1.5 text-sm cursor-pointer">
                                <Upload className="w-4 h-4 mr-2" />
                                {uploading ? 'Uploading...' : 'Upload New Picture'}
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                            JPG, PNG or GIF. Max 5MB.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Cover Upload */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Cover Image</h2>
                {profile.cover_image_url && (
                    <img
                        src={profile.cover_image_url}
                        alt="Cover"
                        className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                )}
                <label className="cursor-pointer">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                        disabled={uploading}
                    />
                    <span className="inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 px-3 py-1.5 text-sm cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Cover Image'}
                    </span>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                    Recommended size: 1500x500px. Max 5MB.
                </p>
            </Card>
        </div>
    )
}

function PrivacySettings({ profile, onUpdate }: { profile: any, onUpdate: () => void }) {
    const [isPublic, setIsPublic] = useState(profile.is_public)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleTogglePublic = async () => {
        setIsLoading(true)
        try {
            await supabase
                .from('profiles')
                // @ts-ignore
                .update({ is_public: !isPublic } as any)
                .eq('id', profile.id)

            setIsPublic(!isPublic)
            onUpdate()
        } catch (error) {
            console.error('Toggle error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Privacy Settings</h2>

            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">Public Profile</h3>
                            {isPublic ? (
                                <Badge variant="success">Public</Badge>
                            ) : (
                                <Badge variant="warning">Private</Badge>
                            )}
                        </div>
                        <p className="text-sm text-gray-600">
                            {isPublic
                                ? 'Your profile is visible to everyone on the internet'
                                : 'Your profile is only visible to you'}
                        </p>
                    </div>
                    <button
                        onClick={handleTogglePublic}
                        disabled={isLoading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-primary-600' : 'bg-gray-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                <div className="pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Profile URL</h3>
                    <div className="flex items-center gap-2">
                        <Input
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${profile.slug}`}
                            readOnly
                            className="flex-1"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/${profile.slug}`)
                                alert('Link copied!')
                            }}
                        >
                            Copy
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}

function SecuritySettings() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setIsLoading(true)
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (updateError) throw updateError

            setSuccess(true)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>

            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">Password changed successfully!</p>
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                />

                <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                />

                <div className="pt-4">
                    <Button type="submit" isLoading={isLoading}>
                        Update Password
                    </Button>
                </div>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 text-red-600">Danger Zone</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="danger" size="sm">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                </Button>
            </div>
        </Card>
    )
}
