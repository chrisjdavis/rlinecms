import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger'
import { userRepository } from '@/lib/repositories/userRepository'

// Simple in-memory rate limiter (per IP)
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>()
const RATE_LIMIT = 10
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get('token');
  const clientIp = req.headers.get("x-forwarded-for") || "unknown"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin || 'http://localhost:3000';

  // Rate limiting logic
  const now = Date.now()
  const rate = rateLimitMap.get(clientIp)
  if (rate) {
    if (now - rate.lastRequest < RATE_LIMIT_WINDOW) {
      if (rate.count >= RATE_LIMIT) {
        logger.warn("Rate limit exceeded for email verification", { ip: clientIp })
        return NextResponse.redirect(`${baseUrl}/login?verified=0&error=ratelimit`)
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

  if (!token) {
    logger.info("Email verification attempt with missing token", { ip: clientIp, audit: true })
    return NextResponse.redirect(`${baseUrl}/login?verified=0&error=missing_token`);
  }

  const user = await userRepository.findByVerificationToken(token);

  if (!user) {
    logger.info("Email verification attempt with invalid token", { token, ip: clientIp, audit: true })
    return NextResponse.redirect(`${baseUrl}/login?verified=0&error=invalid_token`);
  }

  // Check token expiration
  if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
    logger.info("Email verification attempt with expired token", { userId: user.id, ip: clientIp, audit: true })
    return NextResponse.redirect(`${baseUrl}/login?verified=0&error=expired`);
  }

  // Check if email is already verified
  if (user.emailVerified) {
    logger.info("Email verification attempt for already verified email", { userId: user.id, ip: clientIp, audit: true })
    return NextResponse.redirect(`${baseUrl}/login?verified=1&message=already_verified`);
  }

  try {
    await userRepository.update(user.id, {
      emailVerified: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });

    logger.info("Email verified successfully", { userId: user.id, ip: clientIp, audit: true })
    return NextResponse.redirect(`${baseUrl}/login?verified=1&message=success`);
  } catch (error) {
    logger.error("Error during email verification", { 
      userId: user.id, 
      error: error instanceof Error ? error.message : error,
      ip: clientIp, 
      audit: true 
    })
    return NextResponse.redirect(`${baseUrl}/login?verified=0&error=server_error`);
  }
} 