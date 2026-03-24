import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your email and password to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <span className="text-center text-sm mt-4 text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary underline hover:no-underline">
              Sign in
            </Link>
          </span>
        </CardFooter>
      </Card>
    </div>
  )
} 