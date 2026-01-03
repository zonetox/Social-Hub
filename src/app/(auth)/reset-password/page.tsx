import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata = {
    title: 'Reset Password - Social Hub',
    description: 'Enter your new password to regain access to your account.',
}

export default function ResetPasswordPage() {
    return (
        <div className="w-full max-w-md mx-auto">
            <ResetPasswordForm />
        </div>
    )
}
