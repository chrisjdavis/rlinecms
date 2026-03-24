import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { apiKeyRepository } from "@/lib/repositories/apiKeyRepository"
import { generateApiKey } from "@/lib/apiKey"
import { logUserActivity } from "@/lib/activityLog"
import * as z from "zod"

const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.union([z.string().datetime(), z.literal("")]).optional().transform(val => val === "" ? undefined : val),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const [apiKeys, total] = await Promise.all([
      apiKeyRepository.findAll({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
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
      }),
      apiKeyRepository.count({ where: { userId: session.user.id } })
    ])
    
    return NextResponse.json({ apiKeys, total })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = apiKeySchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        errors: parsed.error.flatten() 
      }, { status: 400 })
    }

    const key = generateApiKey()
    const { expiresAt, ...data } = parsed.data

    const apiKey = await apiKeyRepository.create({
      ...data,
      key,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      user: { connect: { id: session.user.id } }
    })

    await logUserActivity({
      userId: session.user.id,
      action: 'api_key_created',
      ip: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      metadata: {
        apiKeyId: apiKey.id,
        apiKeyName: apiKey.name,
      },
    })

    return NextResponse.json(apiKey, { status: 201 })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }
}
