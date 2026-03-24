import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { revalidateTag } from 'next/cache'
import { Block } from "@/components/block-editor"
import * as z from "zod"
import { pageRepository } from '@/lib/repositories/pageRepository'

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const pages = await pageRepository.findAll({
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(pages)
  } catch (error) {
    console.error("[PAGES_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

const pageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  content: z.record(z.string(), z.any()),
  status: z.enum(["DRAFT", "PUBLISHED"])
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { title, slug, content, status } = body

    if (!title || !slug) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const parsed = pageSchema.safeParse({ title, slug, content, status })
    if (!parsed.success) {
      return new NextResponse("Invalid input", { status: 400 })
    }

    // Prepare blocks from content
    const blocks = content && typeof content === 'object'
      ? Object.values(content).map((block, idx: number) => {
        const b = block as Block;
        return {
          id: b.id,
          type: b.type,
          content: typeof b.content === 'object' ? b.content : b.content,
          order: b.order ?? idx,
        }
      })
      : []

    const page = await pageRepository.create(
      {
        title,
        slug,
        status,
        author: { connect: { id: session.user.id } },
        content: blocks.length > 0 ? {} : content,
        blocks: blocks.length > 0 ? { create: blocks } : undefined,
      },
      { include: { blocks: true } }
    )

    // Revalidate pages list and individual page
    revalidateTag('pages')
    revalidateTag(`page-${page.slug}`)

    return NextResponse.json(page)
  } catch (error) {
    console.error("[PAGES_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 