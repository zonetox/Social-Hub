'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RecommendedRequest } from '@/actions/recommendations'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

interface RecommendedRequestsProps {
    requests: RecommendedRequest[]
    className?: string
}

export function RecommendedRequests({ requests, className }: RecommendedRequestsProps) {
    if (requests.length === 0) return null

    return (
        <Card className={`p-6 bg-gradient-to-br from-primary-50 to-white border-primary-100 ${className}`}>
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-500 fill-current" />
                <h3 className="text-lg font-bold text-gray-900">Gợi ý yêu cầu phù hợp với bạn in {requests[0].category_name}</h3>
            </div>

            <div className="space-y-3">
                {requests.map((req) => (
                    <div key={req.id} className="group bg-white p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
                                    {req.title}
                                </h4>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <span>{formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: vi })}</span>
                                    <span>•</span>
                                    <span className="line-clamp-1">{req.description}</span>
                                </p>
                            </div>
                            <Link href={`/requests/${req.id}`}>
                                <Button size="sm" variant="ghost" className="shrink-0 text-primary-600 hover:bg-primary-50">
                                    Báo giá ngay
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-center">
                <Link href="/requests">
                    <Button variant="link" className="text-primary-600">
                        Xem tất cả yêu cầu mới
                    </Button>
                </Link>
            </div>
        </Card>
    )
}
