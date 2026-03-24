import { Metadata } from 'next'
import RequestResetForm from './request-form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Reset Password - RLineCMS',
  description: 'Request a password reset link',
}

export default function RequestResetPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestResetForm />
        </CardContent>
      </Card>
    </div>
  )
} 