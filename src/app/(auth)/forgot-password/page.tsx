import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata = {
    title: 'Forgot Password - Social Hub',
    description: 'Request a password reset link for your account.',
}

export default function ForgotPasswordPage() {
    return (
        <div className="w-full max-w-md mx-auto">
            <ForgotPasswordForm />
        </div>
    )
}
