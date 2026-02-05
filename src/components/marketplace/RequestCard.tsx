'use client'

import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { ArrowRight, Clock, Tag, Users } from 'lucide-react'

interface RequestCardProps {
    request: any
    isOwner?: boolean
}

export function RequestCard({ request, isOwner }: RequestCardProps) {
    return (
        <Card className="hover:shadow-2xl transition-all duration-500 border-none overflow-hidden group bg-white/70 backdrop-blur-xl relative">
            {/* Status Badge Overlays */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
                {request.status === 'closed' && (
                    <Badge variant="default" className="bg-gray-100 text-gray-600 border-gray-200 font-black">
                        ĐÃ ĐÓNG
                    </Badge>
                )}
                {isOwner && (
                    <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-100 font-black">
                        CỦA BẠN
                    </Badge>
                )}
            </div>

            <div className="p-6 flex flex-col h-full">
                {/* Header Information */}
                <div className="mb-4">
                    {request.category && (
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                                <Tag className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black text-primary-700 uppercase tracking-wider">
                                {request.category.name}
                            </span>
                        </div>
                    )}

                    <Link href={`/requests/${request.id}`} className="block group-hover:text-primary-600 transition-colors">
                        <h3 className="text-xl font-black text-gray-900 leading-tight mb-2 line-clamp-2">
                            {request.title}
                        </h3>
                    </Link>

                    <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: vi })}
                            </span>
                        </div>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>
                                {request.offers_count || 0} báo giá
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="flex-grow mb-6">
                    <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
                        {request.description}
                    </p>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-gray-100/50 flex items-center justify-between">
                    <div className="flex -space-x-2">
                        {/* Avatar stack placeholder for visual appeal */}
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
                                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                            </div>
                        ))}
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-primary-50 flex items-center justify-center text-[8px] font-black text-primary-600">
                            +{request.offers_count || 0}
                        </div>
                    </div>

                    <Link href={`/requests/${request.id}`}>
                        <Button
                            variant="ghost"
                            className="text-primary-600 font-black flex items-center gap-2 group/btn px-4 py-2 hover:bg-primary-50 rounded-xl transition-all"
                        >
                            Xem chi tiết
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    )
}
