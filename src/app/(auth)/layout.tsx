import { ReactNode } from 'react'
import { Logo } from '@/components/shared/Logo'

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen relative flex items-center justify-center p-4">
            {/* Background Decorations */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/10 blur-[100px] rounded-full -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary-500/10 blur-[100px] rounded-full -z-10" />

            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <Logo size="lg" className="mb-4" />
                    <p className="text-gray-500 font-medium">Connect everyone in one link</p>
                </div>

                <div className="glass p-1 border-white/20 rounded-[2rem] overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    )
}
