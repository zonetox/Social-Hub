
export const dynamic = 'force-dynamic'

import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
    title: 'Login - Social Hub',
    description: 'Sign in to your Social Hub account',
}

export default function LoginPage() {
    return <LoginForm />
}
