export const runtime = "nodejs";
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { generateToken } from '@/lib/auth/tokens'
import { logger } from '@/lib/logger'
import { userRepository } from '@/lib/repositories/userRepository'

// Simple in-memory rate limiter (per IP)
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>()
const RATE_LIMIT = 5
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour

export async function POST(req: Request) {
  const clientIp = req.headers.get("x-forwarded-for") || "unknown"

  // Rate limiting logic
  const now = Date.now()
  const rate = rateLimitMap.get(clientIp)
  if (rate) {
    if (now - rate.lastRequest < RATE_LIMIT_WINDOW) {
      if (rate.count >= RATE_LIMIT) {
        logger.warn("Rate limit exceeded for password reset request", { ip: clientIp })
        return NextResponse.json(
          { message: "Too many password reset requests. Please try again later." },
          { status: 429 }
        )
      } else {
        rate.count++
        rate.lastRequest = now
        rateLimitMap.set(clientIp, rate)
      }
    } else {
      // Reset window
      rateLimitMap.set(clientIp, { count: 1, lastRequest: now })
    }
  } else {
    rateLimitMap.set(clientIp, { count: 1, lastRequest: now })
  }

  try {
    const { email } = await req.json()

    // Find user by email
    const user = await userRepository.findByEmail(email.toLowerCase())

    // Audit log attempt
    logger.info("Password reset requested", { email, ip: clientIp, userFound: !!user, audit: true })

    // If no user found, still return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate reset token
    const token = await generateToken()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token to database
    await userRepository.update(user.id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    })

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      text: `Click this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.`,
      html: `
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
      `,
    })

    logger.info("Password reset email sent", { userId: user.id, email: user.email, ip: clientIp, audit: true })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Password reset request error', { error: error instanceof Error ? error.message : error, ip: clientIp, audit: true })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 