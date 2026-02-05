'use client'

import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { AlertCircle, LayoutGrid, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function DashboardLoadingSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-500 font-medium">Đang tải dữ liệu...</p>
        </div>
    )
}

interface DashboardErrorStateProps {
    message?: string
    onRetry?: () => void
}

export function DashboardErrorState({ message = 'Có lỗi xảy ra khi tải dữ liệu.', onRetry }: DashboardErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">{message}</p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Thử lại ngay
                </Button>
            )}
        </div>
    )
}

interface DashboardEmptyStateProps {
    title: string
    description: string
    icon?: any
    action?: {
        label: string
        onClick: () => void
    }
}

export function DashboardEmptyState({ title, description, icon: Icon = LayoutGrid, action }: DashboardEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm mt-8">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">{description}</p>
            {action && (
                <Button onClick={action.onClick} className="premium-gradient">
                    {action.label}
                </Button>
            )}
        </div>
    )
}
