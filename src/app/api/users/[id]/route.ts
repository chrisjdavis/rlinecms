import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { Role } from "@prisma/client"
import { auth } from "@/lib/auth"
import * as z from "zod"
import { logger } from '@/lib/logger'
import { logUserActivity } from '@/lib/activityLog';
import { userRepository } from '@/lib/repositories/userRepository';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await context.params
    const user = await userRepository.findById(id)
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    console.error("User retrieval error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  role: z.enum(["USER", "ADMIN", "COMMENTER"]).optional(),
  bio: z.string().max(500).optional().nullable(),
  username: z.string().min(1).max(100).optional().nullable(),
  avatar: z.string().min(1).optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    
    const { id } = await context.params
    
    // Authorization check: only admins can update other users, users can only update themselves
    if (session.user.role !== 'ADMIN' && session.user.id !== id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }
    
    const { name, email, password, role, bio, avatar, username } = await request.json()
    const parsed = userUpdateSchema.safeParse({ name, email, password, role, bio, avatar, username })
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 })
    }
    
    const data: Partial<{ name: string; email: string; role: Role; password: string; bio: string | null; avatar: string; username: string | null }> = { name, email, avatar }
    
    // Only allow admins to change roles
    if (role && session.user.role === 'ADMIN') {
      data.role = role as Role
    }
    
    if (password) {
      data.password = await hash(password, 12)
    }
    
    // Allow clearing bio by setting it to null
    if (bio === null) {
      data.bio = null
    } else if (typeof bio === 'string') {
      data.bio = bio
    }
    
    // Allow clearing username by setting it to null
    if (username === null) {
      data.username = null
    } else if (typeof username === 'string') {
      data.username = username
    }
    
    const user = await userRepository.update(id, data)
    
    // Log the activity
    await logUserActivity({
      userId: session.user.id,
      action: 'user_updated',
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: {
        targetUserId: id,
        updatedFields: Object.keys(data),
        targetUserEmail: user.email,
      },
    });
    
    return NextResponse.json(user)
  } catch (error) {
    console.error("User update error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const isOwner = session.user.id === id
    const isAdmin = session.user.role === "ADMIN"

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Soft delete: set deletedAt
    await userRepository.update(id, { deletedAt: new Date() })
    await logUserActivity({
      userId: session.user.id,
      action: 'account_deleted',
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: { actorId: session.user.id, targetUserId: id, actorRole: session.user.role },
    });
    logger.info('User soft deleted', { userId: id, actorId: session.user.id, audit: true })
    return NextResponse.json({ message: "User soft deleted" })
  } catch (error) {
    console.error("User delete error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}