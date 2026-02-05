'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Button } from '@/components/ui/Button'
import { Zap, X, Crown, Check } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

interface QuotaUpsellModalProps {
    isOpen: boolean
    onClose: () => void
    quota: number
    used: number
    title?: string
}

export function QuotaUpsellModal({ isOpen, onClose, quota, used, title = "Bạn đã đạt giới hạn tháng" }: QuotaUpsellModalProps) {
    const percentage = quota > 0 ? (used / quota) * 100 : 100

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-0 text-left align-middle shadow-2xl transition-all border border-gray-100">
                                {/* Header */}
                                <div className="relative bg-gradient-to-br from-amber-50 to-yellow-50 p-6 sm:p-8 text-center border-b border-amber-100">
                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 text-gray-500 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-white">
                                        <Crown className="w-8 h-8 text-white" fill="currentColor" />
                                    </div>
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-black text-gray-900 mb-2"
                                    >
                                        {title}
                                    </Dialog.Title>
                                    <p className="text-gray-600">
                                        Nâng cấp lên gói VIP để mở khóa thêm lượt sử dụng và các tính năng độc quyền.
                                    </p>
                                </div>

                                {/* Content */}
                                <div className="p-6 sm:p-8 space-y-6">
                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-bold">
                                            <span className="text-gray-600">Đã sử dụng</span>
                                            <span className="text-gray-900">{used} / {quota}</span>
                                        </div>
                                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Features List */}
                                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50">
                                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-500 fill-current" />
                                            Quyền lợi gói VIP
                                        </h4>
                                        <ul className="space-y-2.5">
                                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span>Nhận diện thương hiệu <strong>VIP</strong></span>
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span><strong>x4 quota</strong> gửi yêu cầu hàng tháng</span>
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span><strong>x10 quota</strong> gửi báo giá hàng tháng</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Action */}
                                    <Link href="/dashboard/pricing" className="block">
                                        <Button
                                            size="lg"
                                            className="w-full h-14 text-lg font-bold premium-gradient border-none shadow-xl hover:shadow-2xl shadow-amber-500/20"
                                        >
                                            Nâng Cấp VIP Ngay
                                        </Button>
                                    </Link>
                                    <button
                                        onClick={onClose}
                                        className="w-full text-center text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        Để sau, tôi sẽ suy nghĩ thêm
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
