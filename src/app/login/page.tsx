import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { LoginForm } from "./login-form"
import Link from "next/link"

export default async function LoginPage() {
  const session = await auth()

  if (session) {
    redirect("/admin")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <LoginForm />
      <span className="text-center text-sm mt-4 text-muted-foreground">
        Don&#39;t have an account?{' '}
        <Link href="/register" className="text-primary underline hover:no-underline">
          Register
        </Link>
      </span>
    </div>
  )
} 