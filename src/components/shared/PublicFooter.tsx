'use client'

import { Logo } from '@/components/shared/Logo'
import Link from 'next/link'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

export function PublicFooter() {
    return (
        <footer className="bg-gray-900 text-white pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Logo size="lg" />
                        <p className="text-gray-400 font-medium leading-relaxed">
                            Nền tảng kết nối doanh nghiệp và chuyên gia hàng đầu Việt Nam. Nâng tầm thương hiệu số của bạn với danh thiếp điện tử thông minh.
                        </p>
                        <div className="flex items-center gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary-600 transition-colors">
                                    <Icon className="w-5 h-5 text-white" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-black mb-6 uppercase tracking-wider text-primary-500">Khám phá</h4>
                        <ul className="space-y-4">
                            {[
                                { name: 'Về chúng tôi', href: '#' },
                                { name: 'Danh bạ chuyên gia', href: '/explore' },
                                { name: 'Yêu cầu báo giá', href: '/requests' },
                                { name: 'Bảng giá dịch vụ', href: '/dashboard/pricing' }
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-gray-400 hover:text-white transition-colors font-medium">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-lg font-black mb-6 uppercase tracking-wider text-primary-500">Hỗ trợ</h4>
                        <ul className="space-y-4">
                            {[
                                { name: 'Điều khoản sử dụng', href: '/terms' },
                                { name: 'Chính sách bảo mật', href: '/privacy' },
                                { name: 'Hướng dẫn sử dụng', href: '#' },
                                { name: 'Câu hỏi thường gặp', href: '#' }
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-gray-400 hover:text-white transition-colors font-medium">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-lg font-black mb-6 uppercase tracking-wider text-primary-500">Liên hệ</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-gray-400">
                                <MapPin className="w-5 h-5 text-primary-500 shrink-0 mt-1" />
                                <span className="font-medium">Toà nhà Innovation, Công viên phần mềm Quang Trung, Quận 12, TP.HCM</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400">
                                <Phone className="w-5 h-5 text-primary-500 shrink-0" />
                                <span className="font-medium">0123 456 789</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400">
                                <Mail className="w-5 h-5 text-primary-500 shrink-0" />
                                <span className="font-medium">contact@socialhub.vn</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
                        © 2024 Social HUB - Hệ sinh thái kết nối kinh doanh
                    </p>
                    <div className="flex items-center gap-6 text-xs font-black text-gray-600 uppercase tracking-tighter">
                        <span>Thiết kế bởi Antigravity</span>
                        <span>Phiên bản 2.0.0</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
