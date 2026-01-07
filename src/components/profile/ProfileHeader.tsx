// @ts-nocheck
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
    Share2,
    Camera,
    Image as ImageIcon,
    Loader2
} from 'lucide-react'
import type { Profile, Category } from '@/types/user.types'
import { useEffect } from 'react'

interface ProfileHeaderProps {
    profile: Profile
    onUpdate: () => void
}

import { toast } from 'react-hot-toast'

export function ProfileHeader({ profile, onUpdate }: ProfileHeaderProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        display_name: profile.display_name,
        bio: profile.user?.bio || '',
        website: profile.website || '',
        location: profile.location || '',
        tags: profile.tags?.join(', ') || '',
        category_id: profile.category_id || '',
    })
    const [categories, setCategories] = useState<Category[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState<'avatar' | 'banner' | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('profile_categories')
                .select('*')
                .order('display_order', { ascending: true })
            if (data) setCategories(data)
        }
        fetchCategories()
    }, [])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(type)
        const bucket = type === 'avatar' ? 'avatars' : 'covers'
        const fileExt = file.name.split('.').pop()
        const fileName = `${profile.user_id}/${Math.random()}.${fileExt}`

        try {
            // 1. Upload to Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName)

            // 3. Update Database
            if (type === 'avatar') {
                await supabase
                    .from('users')
                    .update({ avatar_url: publicUrl } as any)
                    .eq('id', profile.user_id)
            } else {
                await supabase
                    .from('profiles')
                    .update({ cover_image_url: publicUrl } as any)
                    .eq('id', profile.id)
            }

            toast.success(`${type === 'avatar' ? 'Avatar' : 'Banner'} updated!`)
            onUpdate()
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Failed to upload image')
        } finally {
            setIsUploading(null)
        }
    }

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
                    category_id: formData.category_id || null,
                } as any)
                .eq('id', profile.id)

            // Update user bio
            await supabase
                .from('users')
                .update({
                    bio: formData.bio || null,
                } as any)
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
            toast.success('Profile link copied to clipboard!')
        } catch (error) {
            toast.error(`Could not copy link. Share this URL: ${url}`, { duration: 6000 })
        }
    }

    return (
        <>
            <Card>
                {/* Cover Image */}
                <div className="relative h-48 group">
                    {profile.cover_image_url ? (
                        <img
                            src={profile.cover_image_url}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-primary-400 to-secondary-400" />
                    )}

                    {/* Banner Upload Button */}
                    <label className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'banner')}
                            disabled={isUploading !== null}
                        />
                        <div className="flex flex-col items-center text-white">
                            {isUploading === 'banner' ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                                <>
                                    <ImageIcon className="w-8 h-8 mb-1" />
                                    <span className="text-sm font-bold">Change Banner</span>
                                </>
                            )}
                        </div>
                    </label>
                </div>

                <div className="p-6">
                    <div className="flex items-start justify-between -mt-20 mb-4">
                        <div className="flex items-end gap-4 relative group">
                            <div className="relative">
                                {profile.user?.avatar_url ? (
                                    <img
                                        src={profile.user.avatar_url}
                                        alt={profile.display_name}
                                        className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                                        <span className="text-4xl font-bold text-white">
                                            {profile.display_name.charAt(0)}
                                        </span>
                                    </div>
                                )}

                                {/* Avatar Upload Button */}
                                <label className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'avatar')}
                                        disabled={isUploading !== null}
                                    />
                                    {isUploading === 'avatar' ? (
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    ) : (
                                        <Camera className="w-8 h-8 text-white" />
                                    )}
                                </label>
                            </div>
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

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Category / Lĩnh vực
                        </label>
                        <select
                            value={formData.category_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                            <option value="">Chọn lĩnh vực...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

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
