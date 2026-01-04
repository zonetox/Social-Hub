'use client'

import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium' | 'rank' | 'gold'
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800 shadow-sm shadow-green-200',
        warning: 'bg-yellow-100 text-yellow-800 shadow-sm shadow-yellow-200',
        danger: 'bg-red-100 text-red-800 shadow-sm shadow-red-200',
        info: 'bg-blue-100 text-blue-800 shadow-sm shadow-blue-200',
        premium: 'premium-gradient text-white shadow-lg animate-glow',
        rank: 'bg-black text-white font-bold tracking-wider',
        gold: 'bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-yellow-950 font-bold border border-yellow-300 shadow-lg',
    }

    return (
        <span
            className={clsx(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    )
}
