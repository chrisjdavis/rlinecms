"use client"

import { useMemo } from "react"
import { Progress } from "@/components/ui/progress"

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return 0

    let score = 0
    const checks = [
      password.length >= 8,                    // Length >= 8
      /[A-Z]/.test(password),                 // Has uppercase
      /[a-z]/.test(password),                 // Has lowercase
      /[0-9]/.test(password),                 // Has number
      /[^A-Za-z0-9]/.test(password),          // Has special char
      password.length >= 12,                   // Length >= 12 (bonus)
      /^(?!.*(.)\1{2,}).*$/.test(password),   // No character repeated 3+ times
      /[^A-Za-z0-9]{2,}/.test(password),      // Multiple special chars (bonus)
    ]

    score = checks.filter(Boolean).length
    return Math.min(100, (score / 8) * 100)
  }, [password])

  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return "Very Weak"
    if (strength <= 25) return "Weak"
    if (strength <= 50) return "Fair"
    if (strength <= 75) return "Good"
    return "Strong"
  }

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return "bg-gray-200"
    if (strength <= 25) return "bg-red-500"
    if (strength <= 50) return "bg-yellow-500"
    if (strength <= 75) return "bg-blue-500"
    return "bg-green-500"
  }

  return (
    <div className="space-y-2">
      <Progress 
        value={strength} 
        className={getStrengthColor(strength)}
      />
      <p className="text-sm text-muted-foreground">
        Password Strength: {getStrengthLabel(strength)}
      </p>
    </div>
  )
} 