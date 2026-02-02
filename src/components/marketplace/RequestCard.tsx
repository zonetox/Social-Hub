'use client'

import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { ArrowRight, Clock, Tag } from 'lucide-react'

interface RequestCardProps {
    request: any
    isOwner?: boolean
}

export function RequestCard({ request, isOwner }: RequestCardProps) {
    return (
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary-500 overflow-hidden group">
            <div className="p-5 sm:p-6">
                <div className="flex justify-between items-start mb-3 gap-4">
                    <div className="flex-1">
                        <Link href={`/requests/${request.id}`} className="group-hover:text-primary-600 transition-colors">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 leading-tight mb-1">
                                {request.title}
                            </h3>
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: vi })}
                            </span>
                            {isOwner && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 ml-2">
                                    Của bạn
                                </Badge>
                            )}
                        </div>
                    </div>
                    {request.category && (
                        <Badge variant="outline" className="whitespace-nowrap flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {request.category.name}
                        </Badge>
                    )}
                </div>

                <p className="text-gray-600 text-sm line-clamp-2 mb-4 bg-gray-50 p-3 rounded-lg italic">
                    "{request.description}"
                </p>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-400">
                        {request.offers_count !== undefined ? `${request.offers_count} báo giá` : 'Đang chờ báo giá'}
                    </div>
                    <Link href={`/requests/${request.id}`}>
                        <button className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 group/btn px-4 py-2 hover:bg-primary-50 rounded-lg transition-colors">
                            Chi tiết
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    </Link>
                </div>
            </div>
        </Card>
    )
}
