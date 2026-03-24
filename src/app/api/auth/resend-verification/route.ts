import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger'
import { userRepository } from '@/lib/repositories/userRepository'
import { sendMailgunEmail } from '@/lib/mailgun'
import { generateRandomToken } from '@/lib/utils'
import { addHours } from 'date-fns'

// Simple in-memory rate limiter (per IP)
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>()
const RATE_LIMIT = 3
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

export async function POST(req: Request) {
  const clientIp = req.headers.get("x-forwarded-for") || "unknown"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Rate limiting logic
  const now = Date.now()
  const rate = rateLimitMap.get(clientIp)
  if (rate) {
    if (now - rate.lastRequest < RATE_LIMIT_WINDOW) {
      if (rate.count >= RATE_LIMIT) {
        logger.warn("Rate limit exceeded for resend verification", { ip: clientIp })
        return NextResponse.json(
          { message: "Too many verification email requests. Please try again later." },
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

    const user = await userRepository.findByEmail(email.toLowerCase())

    // If no user found or email already verified, still return success to prevent email enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true })
    }

    // Generate new verification token
    const emailVerificationToken = generateRandomToken(32)
    const emailVerificationExpires = addHours(new Date(), 24)

    // Update user with new token
    await userRepository.update(user.id, {
      emailVerificationToken,
      emailVerificationExpires,
    })

    // Send verification email
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${emailVerificationToken}`
    await sendMailgunEmail({
      to: email,
      subject: 'Verify your email address',
      text: `Welcome to RLineCMS! Please verify your email by clicking the following link: ${verifyUrl}\n\nThis link will expire in 24 hours.`,
      html: `
        <h1>Welcome to RLineCMS!</h1>
        <p>Thank you for creating an account. To complete your registration, please verify your email address by clicking the button below:</p>
        <p>
          <a href="${verifyUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verifyUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `
    })

    logger.info("Verification email resent", { userId: user.id, email: user.email, ip: clientIp, audit: true })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Resend verification error', { error: error instanceof Error ? error.message : error, ip: clientIp, audit: true })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 