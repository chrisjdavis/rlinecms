import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { profileLinkRepository } from "@/lib/repositories/profileLinkRepository"
import * as z from "zod"

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 })
const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 })

const createLinkSchema = z.object({
  title: z.string().trim().min(1).max(100),
  url: z.string().url(),
  order: z.number().int().min(0).optional()
})

const updateLinkSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1).max(100).optional(),
    url: z.string().url().optional(),
    order: z.number().int().min(0).optional()
  })
  .refine(
    (data) => data.title !== undefined || data.url !== undefined || data.order !== undefined,
    {
      message: "At least one field must be provided",
      path: ["title"]
    }
  )

const deleteLinkSchema = z.object({
  id: z.string().min(1)
})

async function requireSession() {
  const session = await auth()
  if (!session?.user) {
    return { response: unauthorized() } as const
  }
  return { session } as const
}

function ensureOwnerOrAdmin(session: { user: { id: string; role: string } }, ownerId: string) {
  if (session.user.role === "ADMIN" || session.user.id === ownerId) {
    return { allowed: true } as const
  }
  return { response: forbidden() } as const
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSession()
  if ("response" in authResult) return authResult.response

  const { id } = await context.params
  const ownership = ensureOwnerOrAdmin(authResult.session, id)
  if ("response" in ownership) return ownership.response

  const links = await profileLinkRepository.findByUserId(id, { orderBy: { order: "asc" } })
  return NextResponse.json(links)
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireSession()
  if ("response" in authResult) return authResult.response

  const { id } = await context.params
  const ownership = ensureOwnerOrAdmin(authResult.session, id)
  if ("response" in ownership) return ownership.response

  const parsed = createLinkSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
  }

  const { title, url, order } = parsed.data
  const link = await profileLinkRepository.create({
    user: { connect: { id } },
    title,
    url,
    order: order ?? 0
  })
  return NextResponse.json(link, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireSession()
  if ("response" in authResult) return authResult.response

  const parsed = updateLinkSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
  }

  const existingLink = await profileLinkRepository.findById(parsed.data.id)
  if (!existingLink) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 })
  }

  const ownership = ensureOwnerOrAdmin(authResult.session, existingLink.userId)
  if ("response" in ownership) return ownership.response

  const link = await profileLinkRepository.update(parsed.data.id, {
    title: parsed.data.title,
    url: parsed.data.url,
    order: parsed.data.order
  })
  return NextResponse.json(link)
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireSession()
  if ("response" in authResult) return authResult.response

  const parsed = deleteLinkSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
  }

  const existingLink = await profileLinkRepository.findById(parsed.data.id)
  if (!existingLink) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 })
  }

  const ownership = ensureOwnerOrAdmin(authResult.session, existingLink.userId)
  if ("response" in ownership) return ownership.response

  await profileLinkRepository.delete(parsed.data.id)
  return NextResponse.json({ success: true })
}
