// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react'

export function ResetPasswordForm() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [serverError, setServerError] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setServerError('')

        if (password.length < 6) {
            setServerError('Password must be at least 6 characters long')
            return
        }

        if (password !== confirmPassword) {
            setServerError('Passwords do not match')
            return
        }

        setIsLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setIsSuccess(true)
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (error: any) {
            setServerError(error.message || 'Failed to update password')
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Password updated</h2>
                <p className="text-gray-600 mb-6">
                    Your password has been successfully reset. Redirecting you to login...
                </p>
                <Link href="/login">
                    <Button variant="primary" className="w-full">
                        Sign in now
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Set new password</h2>
            <p className="text-gray-600 mb-6">
                Please enter your new password below.
            </p>

            {serverError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{serverError}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="password"
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        required
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-12"
                    isLoading={isLoading}
                >
                    Update password
                </Button>
            </form>
        </div>
    )
}
