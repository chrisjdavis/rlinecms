import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { revalidateTag } from 'next/cache'
import type { Prisma } from "@prisma/client"
import * as z from "zod"
import { blockRepository } from '@/lib/repositories/blockRepository'
import { pageRepository } from '@/lib/repositories/pageRepository'
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

const pageUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  content: z.record(z.string(), z.any()),
  status: z.enum(["DRAFT", "PUBLISHED"])
})

interface Block {
  id: string
  type: string
  content: Prisma.InputJsonValue
  order: number
}

function isBlock(value: unknown): value is Block {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'content' in value &&
    'order' in value &&
    typeof (value as Block).id === 'string' &&
    typeof (value as Block).type === 'string' &&
    typeof (value as Block).order === 'number'
  )
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const result = await prisma.page.findUnique({
      where: { id },
      include: {
        author: true,
        blocks: true,
      },
    })

    if (!result) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    logger.error("Error fetching page", { error, id: (await context.params).id })
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const data = await request.json()
    const { title, slug, content, status } = data

    const parsed = pageUpdateSchema.safeParse({ title, slug, content, status })
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // First fetch the page by id
    const pageRecord = await pageRepository.findById(id)
    if (!pageRecord) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    // Then update the page
    const page = await pageRepository.update(id, {
      title,
      slug,
      content,
      status
    })

    // Handle blocks with upsert logic
    const existingBlocks = await blockRepository.findAll({ where: { pageId: page.id } })
    const incomingBlocks = Object.values(content).filter(isBlock)
    const incomingBlockIds = new Set(incomingBlocks.map(b => b.id))
    const existingBlockIds = new Set(existingBlocks.map(b => b.id))

    // Delete blocks that are no longer present
    const blocksToDelete = existingBlocks.filter(b => !incomingBlockIds.has(b.id))
    await Promise.all(blocksToDelete.map(b => blockRepository.delete(b.id)))

    // Upsert (update or create) blocks
    await Promise.all(incomingBlocks.map(async (block) => {
      if (existingBlockIds.has(block.id)) {
        await blockRepository.update(block.id, {
          type: block.type,
          content: block.content,
          order: block.order,
        })
      } else {
        await blockRepository.create({
          id: block.id,
          type: block.type,
          content: block.content,
          order: block.order,
          page: { connect: { id: page.id } },
        })
      }
    }))

    // Fetch the updated page with all relations
    const updatedPage = await pageRepository.findById(page.id)

    // Revalidate both the old and new slugs to handle slug changes
    revalidateTag('pages')
    revalidateTag(`page-${pageRecord.slug}`)
    if (pageRecord.slug !== slug) {
      revalidateTag(`page-${slug}`)
    }

    return NextResponse.json(updatedPage)
  } catch (error) {
    logger.error("Error updating page", {
      error: error instanceof Error ? error.message : error,
      id: (await context.params).id,
    })
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await context.params
    await prisma.page.delete({
      where: { id },
    })

    logger.info("Page deleted", {
      userId: session.user.id,
      pageId: id,
      audit: true,
    })

    return NextResponse.json({ message: "Page deleted successfully" })
  } catch (error) {
    logger.error("Error deleting page", {
      error: error instanceof Error ? error.message : error,
      id: (await context.params).id,
    })

    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    )
  }
} 