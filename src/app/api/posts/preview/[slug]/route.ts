import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

interface Block {
  type: string
  content: Record<string, unknown>
  order: number
}

interface Metadata {
  key: string
  value: unknown
  type: string
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { slug } = await context.params
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        blocks: {
          orderBy: {
            order: "asc",
          },
        },
        metadata: true,
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    logger.error("Error fetching post preview", {
      error: error instanceof Error ? error.message : error,
      slug: (await context.params).slug,
    })

    return NextResponse.json(
      { error: "Failed to fetch post preview" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { slug } = await context.params
    const { title, content, blocks, metadata, status } = await request.json()

    const updatedPost = await prisma.post.update({
      where: { slug },
      data: {
        title,
        content,
        status,
        blocks: {
          deleteMany: {},
          create: blocks.map((block: Block, index: number) => ({
            type: block.type,
            content: block.content,
            order: index,
          })),
        },
        metadata: {
          deleteMany: {},
          create: metadata.map((item: Metadata) => ({
            key: item.key,
            value: item.value,
            type: item.type,
          })),
        },
        version: {
          increment: 1,
        },
      },
      include: {
        blocks: {
          orderBy: {
            order: "asc",
          },
        },
        metadata: true,
      },
    })

    logger.info("Post preview updated", {
      userId: session.user.id,
      slug,
      audit: true,
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    logger.error("Error updating post preview", {
      error: error instanceof Error ? error.message : error,
      slug: (await context.params).slug,
    })

    return NextResponse.json(
      { error: "Failed to update post preview" },
      { status: 500 }
    )
  }
} 