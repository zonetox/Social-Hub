// @ts-nocheck
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Profile } from '@/types/user.types'
import { Camera, Upload, X } from 'lucide-react'
import Image from 'next/image'

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

    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [bannerFile, setBannerFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState(profile.user?.avatar_url || '')
    const [bannerPreview, setBannerPreview] = useState(profile.cover_image_url || '')

    const [isLoading, setIsLoading] = useState(false)
    const avatarInputRef = useRef<HTMLInputElement>(null)
    const bannerInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            if (type === 'avatar') {
                setAvatarFile(file)
                setAvatarPreview(reader.result as string)
            } else {
                setBannerFile(file)
                setBannerPreview(reader.result as string)
            }
        }
        reader.readAsDataURL(file)
    }

    const uploadImage = async (file: File, bucket: string, userId: string) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError, data } = await supabase.storage
            .from(bucket)
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)

        return publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            let avatarUrl = profile.user?.avatar_url
            let bannerUrl = profile.cover_image_url

            if (avatarFile) {
                avatarUrl = await uploadImage(avatarFile, 'avatars', profile.user_id)
            }

            if (bannerFile) {
                bannerUrl = await uploadImage(bannerFile, 'covers', profile.user_id)
            }

            // @ts-ignore
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: formData.display_name,
                    bio: formData.bio,
                    location: formData.location,
                    website: formData.website,
                    cover_image_url: bannerUrl
                } as any)
                .eq('id', profile.id)

            if (error) throw error

            // Also update user table
            // @ts-ignore
            await supabase
                .from('users')
                .update({
                    full_name: formData.display_name,
                    bio: formData.bio,
                    avatar_url: avatarUrl
                } as any)
                .eq('id', profile.user_id)

            onUpdate()
            onClose()
        } catch (error) {
            console.error('Update profile error:', error)
            alert('Lỗi cập nhật hồ sơ: ' + (error.message || 'Chưa rõ nguyên nhân'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Chỉnh sửa hồ sơ"
        >
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
                {/* Banner Upload */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Ảnh bìa (Banner)</label>
                    <div
                        className="relative h-32 w-full rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 group cursor-pointer"
                        onClick={() => bannerInputRef.current?.click()}
                    >
                        {bannerPreview ? (
                            <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Upload className="w-8 h-8 mb-1" />
                                <span className="text-xs">Tải lên ảnh bìa</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="text-white w-8 h-8" />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={bannerInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'banner')}
                    />
                </div>

                {/* Avatar Upload */}
                <div className="flex justify-center -mt-12 relative z-10">
                    <div className="relative group">
                        <div
                            className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-200 cursor-pointer shadow-lg"
                            onClick={() => avatarInputRef.current?.click()}
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <Camera className="w-8 h-8" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                <Camera className="text-white w-6 h-6" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={avatarInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'avatar')}
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <Input
                        label="Tên hiển thị"
                        value={formData.display_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                        required
                    />

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Tiểu sử (Bio)</label>
                        <textarea
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            rows={3}
                            placeholder="Giới thiệu về bạn..."
                            value={formData.bio}
                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        />
                    </div>

                    <Input
                        label="Địa điểm"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />

                    <Input
                        label="Website"
                        type="url"
                        placeholder="https://example.com"
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    />
                </div>

                <div className="flex gap-3 pt-6 sticky bottom-0 bg-white pb-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1"
                        isLoading={isLoading}
                    >
                        Lưu thay đổi
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
