// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/utils/validation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, Lock, AlertCircle } from 'lucide-react'

export function LoginForm() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [serverError, setServerError] = useState('')
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})
        setServerError('')

        // Validate
        const result = loginSchema.safeParse({ email, password })
        if (!result.success) {
            const fieldErrors: Record<string, string> = {}
            result.error.errors.forEach(err => {
                if (err.path[0]) {
                    fieldErrors[err.path[0] as string] = err.message
                }
            })
            setErrors(fieldErrors)
            return
        }

        setIsLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            // Check if user exists in users table
            const { data: userData } = await supabase
                .from('users')
                .select('is_active')
                .eq('id', data.user.id)
                .single() as any

            if (!userData?.is_active) {
                throw new Error('Your account has been deactivated')
            }

            router.refresh()
            // Small delay to ensure AuthContext catches the state change event
            setTimeout(() => {
                router.push('/hub')
            }, 100)
        } catch (error: any) {
            setServerError(error.message || 'Invalid email or password')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-10 shadow-2xl">
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Welcome back</h2>
            <p className="text-gray-500 mb-8 font-medium">Please sign in to your accounts</p>

            {serverError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{serverError}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={errors.email}
                        className="pl-10"
                        disabled={isLoading}
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={errors.password}
                        className="pl-10"
                        disabled={isLoading}
                    />
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span className="text-gray-600">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700">
                        Forgot password?
                    </Link>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-12 text-lg font-black premium-gradient border-none hover:scale-105 transition-transform"
                    isLoading={isLoading}
                >
                    Sign in
                </Button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                    Sign up
                </Link>
            </div>
        </div>
    )
}
