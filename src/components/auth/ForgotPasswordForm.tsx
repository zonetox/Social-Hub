// @ts-nocheck
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'

export function ForgotPasswordForm() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [serverError, setServerError] = useState('')
    const [isSubmitted, setIsSubmitted] = useState(false)
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setServerError('')

        if (!email) {
            setServerError('Please enter your email address')
            return
        }

        setIsLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) throw error

            setIsSubmitted(true)
        } catch (error: any) {
            setServerError(error.message || 'Failed to send reset link')
        } finally {
            setIsLoading(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                <p className="text-gray-600 mb-6">
                    We&apos;ve sent a password reset link to <span className="font-medium text-gray-900">{email}</span>.
                </p>
                <Link href="/login">
                    <Button variant="outline" className="w-full">
                        Return to login
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8">
            <Link href="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
            </Link>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot password?</h2>
            <p className="text-gray-600 mb-6 font-Inter">
                No worries! Just enter your email and we&apos;ll send you a link to reset your password.
            </p>

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
                    Send reset link
                </Button>
            </form>
        </div>
    )
}
