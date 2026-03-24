import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { apiKeyRepository } from "@/lib/repositories/apiKeyRepository"
import { logUserActivity } from "@/lib/activityLog"
import * as z from "zod"

const apiKeyUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const apiKey = await apiKeyRepository.findById(id, {
      select: {
        id: true,
        name: true,
        key: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    return NextResponse.json(apiKey)
  } catch (error) {
    console.error('Error fetching API key:', error)
    return NextResponse.json({ error: "Failed to fetch API key" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = apiKeyUpdateSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        errors: parsed.error.flatten() 
      }, { status: 400 })
    }

    const { expiresAt, ...data } = parsed.data
    const updateData = {
      ...data,
      ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
    }

    const apiKey = await apiKeyRepository.update(id, updateData)

    await logUserActivity({
      userId: session.user.id,
      action: 'api_key_updated',
      ip: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      metadata: {
        apiKeyId: apiKey.id,
        apiKeyName: apiKey.name,
      },
    })

    return NextResponse.json(apiKey)
  } catch (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json({ error: "Failed to update API key" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await apiKeyRepository.delete(id)

    await logUserActivity({
      userId: session.user.id,
      action: 'api_key_deleted',
      ip: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      metadata: {
        apiKeyId: id,
      },
    })

    return NextResponse.json({ message: "API key deleted successfully" })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 })
  }
}
