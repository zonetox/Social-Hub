// @ts-nocheck
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/lib/utils/formatting'
import {
    Search,
    MoreVertical,
    Shield,
    Ban,
    CheckCircle,
    XCircle,
    Mail,
    Eye,
    Upload
} from 'lucide-react'
import { redirect } from 'next/navigation'
import type { User } from '@/types/user.types'

export default function AdminUsersPage() {
    const { isAdmin, loading: authLoading } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            redirect('/explore')
        }
    }, [authLoading, isAdmin])

    useEffect(() => {
        if (isAdmin) {
            fetchUsers()
        }
    }, [isAdmin])

    useEffect(() => {
        if (!searchQuery) {
            setFilteredUsers(users)
            return
        }

        const query = searchQuery.toLowerCase()
        const filtered = users.filter(user =>
            user.full_name.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        )
        setFilteredUsers(filtered)
    }, [searchQuery, users])

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    *,
                    profile:profiles(slug)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
            setFilteredUsers(data || [])
        } catch (error) {
            console.error('Fetch users error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
        try {
            await supabase
                .from('users')
                // @ts-ignore
                .update({ is_verified: !currentStatus } as any)
                .eq('id', userId)

            fetchUsers()
            setShowActionMenu(null)
        } catch (error) {
            console.error('Toggle verification error:', error)
        }
    }

    const handleToggleActive = async (userId: string, currentStatus: boolean) => {
        try {
            await supabase
                .from('users')
                // @ts-ignore
                .update({ is_active: !currentStatus } as any)
                .eq('id', userId)

            fetchUsers()
            setShowActionMenu(null)
        } catch (error) {
            console.error('Toggle active error:', error)
        }
    }

    const handleMakeAdmin = async (userId: string) => {
        if (!confirm('Are you sure you want to make this user an admin?')) return

        try {
            await supabase
                .from('users')
                // @ts-ignore
                .update({ role: 'admin' } as any)
                .eq('id', userId)

            fetchUsers()
            setShowActionMenu(null)
        } catch (error) {
            console.error('Make admin error:', error)
        }
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                    <p className="text-gray-600">Manage all users on the platform</p>
                </div>
                <Link href="/dashboard/admin/users/bulk-import">
                    <Button className="w-full md:w-auto">
                        <Upload className="w-4 h-4 mr-2" />
                        Bulk Import Profiles
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-gray-600 mb-1">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">
                        {users.filter(u => u.is_active).length}
                    </p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-gray-600 mb-1">Verified Users</p>
                    <p className="text-2xl font-bold text-primary-600">
                        {users.filter(u => u.is_verified).length}
                    </p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-gray-600 mb-1">Admins</p>
                    <p className="text-2xl font-bold text-secondary-600">
                        {users.filter(u => u.role === 'admin').length}
                    </p>
                </Card>
            </div>

            {/* Search */}
            <Card className="p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search by name, username, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </Card>

            {/* Users Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt={user.full_name}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-white">
                                                        {user.full_name.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900">{user.full_name}</p>
                                                    {user.is_verified && (
                                                        <CheckCircle className="w-4 h-4 text-primary-600" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">@{user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm text-gray-900">{user.email}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.is_active ? (
                                            <Badge variant="success">Active</Badge>
                                        ) : (
                                            <Badge variant="danger">Inactive</Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.role === 'admin' ? (
                                            <Badge variant="info">Admin</Badge>
                                        ) : (
                                            <Badge variant="default">User</Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="relative inline-block">
                                            <button
                                                onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-5 h-5 text-gray-500" />
                                            </button>

                                            {showActionMenu === user.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setShowActionMenu(null)}
                                                    />
                                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                                        <button
                                                            onClick={() => window.open(`/${user.profile?.[0]?.slug || user.username}`, '_blank')}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View Profile
                                                        </button>

                                                        <button
                                                            onClick={() => handleToggleVerification(user.id, user.is_verified)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            {user.is_verified ? (
                                                                <>
                                                                    <XCircle className="w-4 h-4" />
                                                                    Remove Verification
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    Verify User
                                                                </>
                                                            )}
                                                        </button>

                                                        {user.role !== 'admin' && (
                                                            <button
                                                                onClick={() => handleMakeAdmin(user.id)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            >
                                                                <Shield className="w-4 h-4" />
                                                                Make Admin
                                                            </button>
                                                        )}

                                                        <div className="border-t border-gray-200 my-1" />

                                                        <button
                                                            onClick={() => handleToggleActive(user.id, user.is_active)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                            {user.is_active ? 'Deactivate User' : 'Activate User'}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No users found</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
