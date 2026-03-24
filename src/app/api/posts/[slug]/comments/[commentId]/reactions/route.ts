import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; commentId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { commentId } = await context.params
    const { type } = await request.json()

    if (!type || !["like", "dislike", "love", "laugh", "angry"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid reaction type" },
        { status: 400 }
      )
    }

    const reaction = await prisma.reaction.create({
      data: {
        type,
        userId: session.user.id,
        commentId,
      },
    })

    logger.info("Reaction added", {
      userId: session.user.id,
      commentId,
      reactionType: type,
      audit: true,
    })

    return NextResponse.json(reaction)
  } catch (error) {
    logger.error("Error adding reaction", {
      error: error instanceof Error ? error.message : error,
      commentId: (await context.params).commentId,
    })

    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string; commentId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { commentId } = await context.params
    await prisma.reaction.deleteMany({
      where: {
        userId: session.user.id,
        commentId,
      },
    })

    logger.info("Reaction removed", {
      userId: session.user.id,
      commentId,
      audit: true,
    })

    return NextResponse.json({ message: "Reaction removed successfully" })
  } catch (error) {
    logger.error("Error removing reaction", {
      error: error instanceof Error ? error.message : error,
      commentId: (await context.params).commentId,
    })

    return NextResponse.json(
      { error: "Failed to remove reaction" },
      { status: 500 }
    )
  }
} 