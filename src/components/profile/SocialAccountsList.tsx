// @ts-nocheck
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SOCIAL_PLATFORMS } from '@/lib/utils/constants'
import {
    ExternalLink,
    Trash2,
    Eye,
    EyeOff,
    GripVertical,
    BarChart3
} from 'lucide-react'
import type { SocialAccount } from '@/types/user.types'

interface SocialAccountsListProps {
    accounts: SocialAccount[]
    onUpdate: () => void
}

export function SocialAccountsList({ accounts, onUpdate }: SocialAccountsListProps) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const supabase = createClient()

    const handleToggleVisibility = async (accountId: string, currentVisibility: boolean) => {
        try {
            await supabase
                .from('social_accounts')
                .update({ is_visible: !currentVisibility } as any)
                .eq('id', accountId)

            onUpdate()
        } catch (error) {
            console.error('Toggle visibility error:', error)
        }
    }

    const handleDelete = async (accountId: string) => {
        if (!confirm('Are you sure you want to delete this account?')) return

        setIsDeleting(accountId)
        try {
            await supabase
                .from('social_accounts')
                .delete()
                .eq('id', accountId)

            onUpdate()
        } catch (error) {
            console.error('Delete error:', error)
        } finally {
            setIsDeleting(null)
        }
    }

    if (accounts.length === 0) {
        return (
            <Card className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                    <ExternalLink className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No social accounts yet
                </h3>
                <p className="text-gray-600">
                    Add your first social media account to get started
                </p>
            </Card>
        )
    }

    return (
        <div className="space-y-3">
            {accounts.map((account) => {
                const platform = SOCIAL_PLATFORMS.find(p => p.name === account.platform)

                return (
                    <Card key={account.id} className="p-4">
                        <div className="flex items-center gap-4">
                            {/* Drag Handle */}
                            <button className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                                <GripVertical className="w-5 h-5" />
                            </button>

                            {/* Platform Icon */}
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                                style={{ backgroundColor: platform?.color || '#6B7280' }}
                            >
                                <span className="text-xl font-bold">
                                    {account.platform.charAt(0)}
                                </span>
                            </div>

                            {/* Account Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900">
                                    {account.platform}
                                </h4>
                                <p className="text-sm text-gray-600 truncate">
                                    @{account.platform_username}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <BarChart3 className="w-4 h-4" />
                                <span>{account.click_count} clicks</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggleVisibility(account.id, account.is_visible)}
                                    title={account.is_visible ? 'Hide' : 'Show'}
                                >
                                    {account.is_visible ? (
                                        <Eye className="w-4 h-4" />
                                    ) : (
                                        <EyeOff className="w-4 h-4" />
                                    )}
                                </Button>

                                <a
                                    href={account.platform_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button size="sm" variant="ghost">
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </a>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(account.id)}
                                    disabled={isDeleting === account.id}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}
