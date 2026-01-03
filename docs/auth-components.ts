// ============================================
// src/app/(auth)/layout.tsx
// ============================================

import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl mb-4">
            <span className="text-3xl font-bold text-white">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Social Hub</h1>
          <p className="text-gray-600 mt-2">Connect all your social profiles</p>
        </div>
        
        {children}
      </div>
    </div>
  )
}

// ============================================
// src/components/auth/LoginForm.tsx
// ============================================

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
        .single()

      if (!userData?.is_active) {
        throw new Error('Your account has been deactivated')
      }

      router.push('/hub')
      router.refresh()
    } catch (error: any) {
      setServerError(error.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome back</h2>

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
          className="w-full"
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

// ============================================
// src/components/auth/RegisterForm.tsx
// ============================================

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
        .single()

      if (existingUser) {
        setErrors({ username: 'Username already taken' })
        setIsLoading(false)
        return
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      // Create user in users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          username: formData.username,
          full_name: formData.full_name,
        })

      if (userError) throw userError

      router.push('/hub')
      router.refresh()
    } catch (error: any) {
      console.error('Registration error:', error)
      setServerError(error.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create your account</h2>

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
          className="w-full"
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

// ============================================
// src/app/(auth)/login/page.tsx
// ============================================

import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Login - Social Hub',
  description: 'Sign in to your Social Hub account',
}

export default function LoginPage() {
  return <LoginForm />
}

// ============================================
// src/app/(auth)/register/page.tsx
// ============================================

import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Sign Up - Social Hub',
  description: 'Create your Social Hub account',
}

export default function RegisterPage() {
  return <RegisterForm />
}