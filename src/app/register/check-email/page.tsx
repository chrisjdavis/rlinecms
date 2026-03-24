"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function CheckEmailPage() {
  const [isResending, setIsResending] = useState(false)

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: localStorage.getItem("pendingVerificationEmail") }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to resend verification email")
      }

      toast.success("Verification email resent! Please check your inbox.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend verification email")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded border bg-white p-8 shadow">
        <h1 className="mb-4 text-2xl font-bold">Check your email</h1>
        <p className="mb-2">We&apos;ve sent a verification link to your email address.</p>
        <p className="mb-4">Please click the link in your email to complete your registration and activate your account.</p>
        <div className="space-y-4">
          <Button 
            onClick={handleResendVerification} 
            disabled={isResending}
            className="w-full"
          >
            {isResending ? "Resending..." : "Resend Verification Email"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Didn&apos;t get the email? Check your spam folder or{" "}
            <Link href="/login" className="text-primary underline">
              log in
            </Link>{" "}
            to try again.
          </p>
        </div>
      </div>
    </div>
  )
} 