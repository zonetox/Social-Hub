'use client'

import { useState, useEffect } from 'react'
import { HeroSearch } from './HeroSearch'
import { Button } from '@/components/ui/Button'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

const slides = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80',
        headline: 'Kết Nối Doanh Nghiệp & Chuyên Gia Hàng Đầu',
        sub: 'Tìm kiếm đối tác tin cậy cho dự án của bạn ngay hôm nay.'
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80',
        headline: 'Mở Rộng Mạng Lưới Kinh Doanh B2B',
        sub: 'Tiếp cận hàng nghìn khách hàng tiềm năng thông qua danh thiếp số chuyên nghiệp.'
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80',
        headline: 'Nền Tảng Yêu Cầu & Báo Giá Linh Hoạt',
        sub: 'Đăng yêu cầu, nhận báo giá từ các nhà cung cấp uy tín trong vài phút.'
    }
]

export function HeroSlider() {
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    return (
        <section className="relative h-[550px] sm:h-[650px] w-full overflow-hidden bg-gray-900 text-white">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 z-0"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${slides[current].image})` }}
                    />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                </motion.div>
            </AnimatePresence>

            <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-sm font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Nền tảng Directory Marketplace số 1 Việt Nam</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 max-w-4xl leading-tight">
                    {slides[current].headline}
                </h1>

                <p className="text-lg sm:text-xl text-gray-200 mb-10 max-w-2xl font-medium">
                    {slides[current].sub}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/requests/create">
                        <Button size="lg" className="premium-gradient font-bold h-14 px-8 rounded-full shadow-xl hover:scale-105 transition-transform w-full sm:w-auto">
                            Nhận tư vấn & báo giá
                        </Button>
                    </Link>
                    <Link href="/explore">
                        <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/30 hover:bg-white/20 text-white font-bold h-14 px-8 rounded-full shadow-xl hover:scale-105 transition-transform w-full sm:w-auto">
                            Khám phá doanh nghiệp
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${current === idx ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'
                            }`}
                    />
                ))}
            </div>
        </section>
    )
}
