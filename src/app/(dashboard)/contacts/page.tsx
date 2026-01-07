'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Users, Search, Trash2, ArrowRight, Plus, Folder, Filter, Settings2, Check } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

export default function ContactsPage() {
    const { user } = useAuth()
    const [contacts, setContacts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    // UI State
    const [showAddCategory, setShowAddCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [isSavingCategory, setIsSavingCategory] = useState(false)
    const [showAssignCategory, setShowAssignCategory] = useState<{ contactId: string, currentId: string | null } | null>(null)

    const supabase = createClient()

    useEffect(() => {
        if (user) {
            fetchInitialData()
        }
    }, [user])

    const fetchInitialData = async () => {
        setLoading(true)
        await Promise.all([
            fetchContacts(),
            fetchCategories()
        ])
        setLoading(false)
    }

    const fetchContacts = async () => {
        if (!user?.id) return
        try {
            const { data, error } = await supabase
                // @ts-ignore
                .from('contacts')
                // @ts-ignore
                .select(`
                    id,
                    notes,
                    category_id,
                    contact_profile:contact_profile_id (
                        id,
                        display_name,
                        slug,
                        cover_image_url,
                        user:user_id (
                            avatar_url,
                            username,
                            email
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setContacts(data || [])
        } catch (error) {
            console.error('Fetch contacts error:', error)
        }
    }

    const fetchCategories = async () => {
        if (!user?.id) return
        try {
            const { data, error } = await supabase
                // @ts-ignore
                .from('contact_categories')
                // @ts-ignore
                .select('*')
                .eq('user_id', user.id)
                .order('name')

            if (error) throw error
            setCategories(data || [])
        } catch (error) {
            console.error('Fetch categories error:', error)
        }
    }

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategoryName.trim() || !user) return

        setIsSavingCategory(true)
        try {
            const { data, error } = await supabase
                .from('contact_categories')
                // @ts-ignore - Database types are being updated but build still fails with 'never'
                .insert({
                    user_id: user.id,
                    name: newCategoryName.trim(),
                    color: '#6366f1' // Default color
                })
                .select()
                .single()

            if (error) throw error
            setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)))
            setNewCategoryName('')
            setShowAddCategory(false)
        } catch (error) {
            console.error('Add category error:', error)
        } finally {
            setIsSavingCategory(false)
        }
    }

    const handleAssignCategory = async (contactId: string, categoryId: string | null) => {
        try {
            const { error } = await supabase
                // @ts-ignore
                .from('contacts')
                // @ts-ignore
                .update({ category_id: categoryId })
                .eq('id', contactId)

            if (error) throw error

            setContacts(contacts.map(c =>
                c.id === contactId ? { ...c, category_id: categoryId } : c
            ))
            setShowAssignCategory(null)
        } catch (error) {
            console.error('Assign category error:', error)
        }
    }

    const removeContact = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa liên hệ này?')) return

        try {
            const { error } = await supabase
                // @ts-ignore
                .from('contacts')
                // @ts-ignore
                .delete()
                .eq('id', id)

            if (error) throw error
            setContacts(contacts.filter(c => c.id !== id))
        } catch (error) {
            console.error('Remove contact error:', error)
        }
    }

    const filteredContacts = contacts.filter(c => {
        const matchesSearch = c.contact_profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.contact_profile?.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory ? c.category_id === selectedCategory : true
        return matchesSearch && matchesCategory
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary-600" />
                        Danh bạ Online
                    </h1>
                    <p className="text-gray-500 font-medium">Quản lý và phân loại các profile bạn đã lưu.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm danh bạ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-full md:w-64 transition-all"
                        />
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setShowAddCategory(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Danh mục
                    </Button>
                </div>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide text-sm">
                <Button
                    size="sm"
                    variant={selectedCategory === null ? 'primary' : 'outline'}
                    className="rounded-full whitespace-nowrap"
                    onClick={() => setSelectedCategory(null)}
                >
                    Tất cả
                </Button>
                {categories.map((cat) => (
                    <Button
                        key={cat.id}
                        size="sm"
                        variant={selectedCategory === cat.id ? 'primary' : 'outline'}
                        className="rounded-full whitespace-nowrap"
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        {cat.name}
                        <span className="ml-2 opacity-60 text-xs text-inherit">
                            ({contacts.filter(c => c.category_id === cat.id).length})
                        </span>
                    </Button>
                ))}
            </div>

            {/* Contacts Grid */}
            {filteredContacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContacts.map((contact) => {
                        const contactCategory = categories.find(cat => cat.id === contact.category_id)
                        return (
                            <Card key={contact.id} className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300">
                                {/* Header / Cover */}
                                <div className="h-24 relative">
                                    {contact.contact_profile?.cover_image_url ? (
                                        <img
                                            src={contact.contact_profile.cover_image_url}
                                            className="w-full h-full object-cover"
                                            alt="Cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-r from-primary-500 to-secondary-500" />
                                    )}
                                    <div className="absolute inset-0 bg-black/20" />

                                    {/* Category Badge on Card */}
                                    {contactCategory && (
                                        <div className="absolute top-3 right-3">
                                            <Badge className="bg-white/90 text-primary-900 border-none shadow-sm backdrop-blur-sm">
                                                <Folder className="w-3 h-3 mr-1" />
                                                {contactCategory.name}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 pt-0 relative">
                                    {/* Avatar */}
                                    <div className="flex justify-between items-end -mt-10 mb-4 px-2">
                                        <div className="relative">
                                            {contact.contact_profile?.user?.avatar_url ? (
                                                <img
                                                    src={contact.contact_profile.user.avatar_url}
                                                    className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg object-cover"
                                                    alt="Avatar"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-2xl">
                                                    {contact.contact_profile?.display_name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 mb-2">
                                            <button
                                                onClick={() => setShowAssignCategory({ contactId: contact.id, currentId: contact.category_id })}
                                                className="p-2 text-gray-400 hover:text-primary-500 transition-colors bg-white rounded-lg shadow-sm border border-gray-100"
                                                title="Phân loại"
                                            >
                                                <Settings2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => removeContact(contact.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-lg shadow-sm border border-gray-100"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                            {contact.contact_profile?.display_name}
                                        </h3>
                                        <p className="text-primary-600 font-semibold text-sm">
                                            @{contact.contact_profile?.user?.username}
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-50 flex gap-3">
                                        <Link
                                            href={`/hub/${contact.contact_profile?.slug}`}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
                                        >
                                            View Profile
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card className="p-12 text-center bg-gray-50 border-dashed border-2 border-gray-200">
                    <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy kết quả</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác nhé!
                    </p>
                </Card>
            )}

            {/* Add Category Modal */}
            <Modal
                isOpen={showAddCategory}
                onClose={() => setShowAddCategory(false)}
                title="Quản lý danh mục"
                size="sm"
            >
                <form onSubmit={handleAddCategory} className="space-y-4">
                    <Input
                        label="Tên danh mục mới"
                        placeholder="VD: Đối tác, Bạn thân..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required
                    />
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 rounded-xl"
                            onClick={() => setShowAddCategory(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 rounded-xl"
                            isLoading={isSavingCategory}
                        >
                            Thêm
                        </Button>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Danh sách hiện tại</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {categories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
                                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!confirm('Xóa danh mục này? Các liên hệ sẽ trở về trạng thái chưa phân loại.')) return
                                            // @ts-ignore
                                            await supabase.from('contact_categories').delete().eq('id', cat.id)
                                            setCategories(categories.filter(c => c.id !== cat.id))
                                            setContacts(contacts.map(c => c.category_id === cat.id ? { ...c, category_id: null } : c))
                                        }}
                                        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Assign Category Modal */}
            <Modal
                isOpen={!!showAssignCategory}
                onClose={() => setShowAssignCategory(null)}
                title="Phân loại liên hệ"
                size="sm"
            >
                <div className="space-y-2">
                    <button
                        onClick={() => handleAssignCategory(showAssignCategory!.contactId, null)}
                        className={clsx(
                            "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                            showAssignCategory?.currentId === null ? "bg-primary-50 text-primary-700 border border-primary-200" : "hover:bg-gray-50 border border-transparent"
                        )}
                    >
                        <span className="font-medium text-sm">Chưa phân loại</span>
                        {showAssignCategory?.currentId === null && <Check className="w-4 h-4" />}
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleAssignCategory(showAssignCategory!.contactId, cat.id)}
                            className={clsx(
                                "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                                showAssignCategory?.currentId === cat.id ? "bg-primary-50 text-primary-700 border border-primary-200" : "hover:bg-gray-50 border border-transparent"
                            )}
                        >
                            <span className="font-medium text-sm">{cat.name}</span>
                            {showAssignCategory?.currentId === cat.id && <Check className="w-4 h-4" />}
                        </button>
                    ))}
                    {categories.length === 0 && (
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-500 mb-3">Bạn chưa tạo danh mục nào.</p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => {
                                    setShowAssignCategory(null)
                                    setShowAddCategory(true)
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo ngay
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}
