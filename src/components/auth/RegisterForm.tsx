// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { registerSchema } from '@/lib/utils/validation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, Lock, User, AlertCircle } from 'lucide-react'

export function RegisterForm() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        full_name: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [serverError, setServerError] = useState('')
    const supabase = createClient()

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})
        setServerError('')

        // Validate
        const result = registerSchema.safeParse(formData)
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
            // Check if username already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('username')
                .eq('username', formData.username)
                .single() as any

            if (existingUser) {
                setErrors({ username: 'Username already taken' })
                setIsLoading(false)
                return
            }

            // Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name,
                        username: formData.username
                    }
                }
            })

            if (authError) throw authError
            if (!authData.user) throw new Error('Failed to create user')

            // The user record and profile are now handled ATOMICALLY by 
            // the Database Trigger on_auth_user_created in Supabase.
            // This is safer and faster for thousands of users.

            router.refresh()
            setTimeout(() => {
                router.push('/hub')
            }, 100)
        } catch (error: any) {
            console.error('Registration error:', error)
            setServerError(error.message || 'Failed to create account')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-10 shadow-2xl">
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Get started</h2>
            <p className="text-gray-500 mb-8 font-medium">Create your professional profile today</p>

            {serverError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{serverError}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Full name"
                        value={formData.full_name}
                        onChange={(e) => handleChange('full_name', e.target.value)}
                        error={errors.full_name}
                        className="pl-10"
                        disabled={isLoading}
                    />
                </div>

                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) => handleChange('username', e.target.value)}
                        error={errors.username}
                        className="pl-10"
                        disabled={isLoading}
                    />
                </div>

                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        error={errors.email}
                        className="pl-10"
                        disabled={isLoading}
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="password"
                        placeholder="Password (min 8 characters)"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        error={errors.password}
                        className="pl-10"
                        disabled={isLoading}
                    />
                </div>

                <div className="text-xs text-gray-600">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" className="text-primary-600 hover:text-primary-700">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                        Privacy Policy
                    </Link>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-12 text-lg font-black premium-gradient border-none hover:scale-105 transition-transform"
                    isLoading={isLoading}
                >
                    Create account
                </Button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                    Sign in
                </Link>
            </div>
        </div>
    )
}
