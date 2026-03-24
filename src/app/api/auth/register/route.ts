export const runtime = "nodejs";
import { NextResponse } from "next/server"
import argon2 from "argon2"
import { sendMailgunEmail } from '@/lib/mailgun'
import { generateRandomToken } from '@/lib/utils'
import { registrationSchema, getValidationErrorMessage } from '@/lib/auth/validation'
import { logger } from '@/lib/logger'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'
import { addHours } from 'date-fns'
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
        logger.warn("Rate limit exceeded for registration", { ip: clientIp })
        return NextResponse.json(
          { message: "Too many registration attempts. Please try again later." },
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
    const body = await req.json()
    
    try {
      const validatedData = await registrationSchema.parseAsync(body)
      const { name, email, password, username, bio } = validatedData

      // Check for existing user by email (case insensitive)
      const existingUserByEmail = await userRepository.findByEmail(email)

      if (existingUserByEmail) {
        logger.info("Registration attempt with existing email", { 
          email,
          ip: clientIp 
        })
        return NextResponse.json(
          { message: "An account with this email already exists" },
          { status: 400 }
        )
      }

      // Check for existing username if provided (case insensitive)
      if (username) {
        const existingUserByUsername = await userRepository.findByUsername(username)

        if (existingUserByUsername) {
          logger.info("Registration attempt with existing username", { 
            username,
            ip: clientIp 
          })
          return NextResponse.json(
            { message: "This username is already taken" },
            { status: 400 }
          )
        }
      }

      const hashedPassword = await argon2.hash(password)
      const emailVerificationToken = generateRandomToken(32)
      const emailVerificationExpires = addHours(new Date(), 24)

      const userData: Prisma.UserCreateInput = {
        name,
        email,
        password: hashedPassword,
        role: "COMMENTER",
        emailVerificationToken,
        emailVerificationExpires,
        username,
        bio,
        // Placeholder for future preferences
        // preferences: {},
      }

      // Create user and send verification email
      const user = await userRepository.create(userData)
      
      // Activity log placeholder (future: write to ActivityLog table)
      logger.info("User registration activity", {
        userId: user.id,
        action: "register",
        ip: clientIp,
      })

      // Send verification email
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
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

      logger.info("New user registered (audit)", {
        userId: user.id,
        email: user.email,
        ip: clientIp,
        audit: true,
      })

      return NextResponse.json(
        { message: "User created successfully. Please check your email to verify your account." },
        { status: 201 }
      )
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        logger.info("Invalid registration input", { 
          errors: validationError.errors,
          ip: clientIp 
        })
        return NextResponse.json(
          getValidationErrorMessage(validationError),
          { status: 400 }
        )
      }
      throw validationError
    }
  } catch (error) {
    logger.error("Registration error (audit)", { 
      error: error instanceof Error ? error.message : "Unknown error",
      ip: clientIp,
      audit: true,
    })
    return NextResponse.json(
      { message: "An error occurred while creating your account. Please try again later." },
      { status: 500 }
    )
  }
} 