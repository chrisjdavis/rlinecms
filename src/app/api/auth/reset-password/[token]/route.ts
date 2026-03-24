export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import * as argon2 from "argon2"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { password } = await request.json()
    const { token } = await context.params

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      )
    }

    // Find the user with the reset token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await argon2.hash(password)

    // Update the user's password and clear the reset token
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      },
    })

    logger.info("Password reset successful", {
      userId: user.id,
      email: user.email,
      audit: true,
    })

    return NextResponse.json({ message: "Password reset successful" })
  } catch (error) {
    logger.error("Error resetting password", {
      error: error instanceof Error ? error.message : error,
      token: (await context.params).token,
    })
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
} 