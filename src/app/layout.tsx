
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
    title: 'Social Hub - All your links in one place',
    description: 'Create a beautiful, personalized profile to showcase all your social media accounts.',
}

import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/contexts/AuthContext'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.variable} font-sans antialiased text-gray-900 bg-gray-50`}>
                <AuthProvider>
                    <Toaster position="top-right" />
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
