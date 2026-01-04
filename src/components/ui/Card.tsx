'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hover?: boolean
    variant?: 'default' | 'glass' | 'glass-dark'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, hover = false, variant = 'default', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={clsx(
                    variant === 'default' && 'bg-white border border-gray-200 shadow-sm',
                    variant === 'glass' && 'glass',
                    variant === 'glass-dark' && 'glass-dark',
                    'rounded-2xl',
                    hover && 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)

Card.displayName = 'Card'
