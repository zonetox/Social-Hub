'use client'

import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
    className?: string
    showText?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
    const dim = {
        sm: { icon: 24, text: 'text-lg' },
        md: { icon: 32, text: 'text-2xl' },
        lg: { icon: 48, text: 'text-4xl' }
    }[size]

    return (
        <Link href="/" className={`flex items-center gap-2 group transition-all duration-300 hover:scale-105 ${className}`}>
            <div className={`relative ${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12'} overflow-hidden rounded-lg shadow-lg group-hover:shadow-primary-500/25 transition-shadow`}>
                <Image
                    src="/icon.png"
                    alt="Social HUB Logo"
                    fill
                    className="object-cover"
                />
            </div>
            {showText && (
                <span className={`font-black tracking-tighter ${dim.text} bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 group-hover:brightness-110 transition-all`}>
                    Social HUB
                </span>
            )}
        </Link>
    )
}
