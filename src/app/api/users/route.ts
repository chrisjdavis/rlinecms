export const runtime = "nodejs";
import { NextResponse } from "next/server"
import { createUser } from "@/lib/auth/createUser"
import { auth } from "@/lib/auth"
import { registrationSchema, getValidationErrorMessage } from "@/lib/auth/validation"
import { ZodError } from "zod"
import { userRepository } from '@/lib/repositories/userRepository';

export async function GET() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await userRepository.findAll({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Allow admin to set role, but default to USER if not provided
    const { role = "USER", sendWelcomeEmail = false, ...rest } = body
    // Validate using the enhanced registration schema
    const validated = await registrationSchema.parseAsync(rest)
    // Use the shared createUser utility
    const user = await createUser({
      ...validated,
      role,
      requireEmailVerification: false, // Admin-created users are auto-verified
      sendWelcomeEmail,
      ip: req.headers.get("x-forwarded-for") || "admin-panel",
    })
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      username: user.username,
      bio: user.bio,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(getValidationErrorMessage(error), { status: 400 })
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "Something went wrong" }, { status: 400 })
  }
} 