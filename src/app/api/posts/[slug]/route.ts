import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { Block } from '@/components/block-editor'
import { Metadata } from '@/components/ui/metadata-editor'
import { fetchWeatherAndMusic } from '@/lib/metadata'
import { revalidateTag } from 'next/cache'
import * as z from "zod"
import { postRepository } from '@/lib/repositories/postRepository'
import { blockRepository } from '@/lib/repositories/blockRepository'
import { metadataRepository } from '@/lib/repositories/metadataRepository'
import { Role } from "@prisma/client"
import { logUserActivity } from '@/lib/activityLog'
import { logger } from '@/lib/logger'

function getSlugFromRequest(request: Request): string | null {
  const url = new URL(request.url)
  const parts = url.pathname.split("/")
  const slugIndex = parts.indexOf("posts") + 1
  return parts[slugIndex] || null
}

function isBlock(value: unknown): value is Block {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'content' in value &&
    'order' in value &&
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    typeof value.order === 'number'
  )
}

const postUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  content: z.record(z.string(), z.any()),
  excerpt: z.string().max(500).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.array(z.object({ key: z.string(), value: z.any(), type: z.string() })).optional()
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const post = await postRepository.findBySlug(slug, { include: { metadata: true, author: true, blocks: true } })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const slug = getSlugFromRequest(request)
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 })
    }
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { title, slug: newSlug, content, excerpt, status, scheduledAt, metadata = [] } = data

    const parsed = postUpdateSchema.safeParse({ title, slug: newSlug, content, excerpt, status, scheduledAt, metadata })
    if (!parsed.success) {
      console.error("Validation errors:", parsed.error.flatten())
      return NextResponse.json({ error: "Invalid input", errors: parsed.error.flatten() }, { status: 400 })
    }

    // First fetch the post by slug
    const postRecord = await postRepository.findBySlug(slug)
    if (!postRecord) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Then update the post
    const post = await postRepository.update(postRecord.id, {
      title,
      slug: newSlug,
      content,
      excerpt,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null
    })

    // Handle blocks with upsert logic
    const existingBlocks = await blockRepository.findAll({ where: { postId: post.id } })
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
          post: { connect: { id: post.id } },
        })
      }
    }))

    // Only fetch weather and music data for drafts
    const combinedMetadata = [...metadata];
    if (status === 'DRAFT') {
      const autoMetadata = await fetchWeatherAndMusic();

      // Filter out any auto-metadata that might already exist
      const existingKeys = new Set(metadata.map((m: Metadata) => m.key));

      const newAutoMetadata = autoMetadata.filter((m: Metadata) => !existingKeys.has(m.key));

      combinedMetadata.push(...newAutoMetadata);
    }

    // Delete existing metadata
    await metadataRepository.deleteMany({ postId: post.id });

    // Create new metadata, ensuring no duplicates
    if (combinedMetadata.length > 0) {
      // Use a Map to ensure unique key/postId combinations
      const uniqueMetadata = new Map(
        combinedMetadata.map(meta => [meta.key, meta])
      );

      const finalMetadata = Array.from(uniqueMetadata.values());

      await metadataRepository.createMany(
        finalMetadata.map((meta: Metadata) => ({
          key: meta.key,
          value: meta.value,
          type: meta.type,
          postId: post.id
        }))
      );
    }

    // Fetch the updated post with all relations
    const updatedPost = await postRepository.findById(post.id)

    // Revalidate both the old and new slugs to handle slug changes
    revalidateTag('posts')
    revalidateTag(`post-${slug}`)
    if (slug !== newSlug) {
      revalidateTag(`post-${newSlug}`)
    }

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await context.params
    const post = await postRepository.findBySlug(slug)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const isOwner = post.authorId === session.user.id
    const privilegedRoles: Role[] = [Role.ADMIN]
    const hasPrivilegedRole = privilegedRoles.includes(session.user.role as Role)

    if (!isOwner && !hasPrivilegedRole) {
      logger.warn(
        `Unauthorized delete attempt by user ${session.user.id} on post ${post.id}`,
        {
          userId: session.user.id,
          postId: post.id,
          role: session.user.role,
        }
      )

      const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      const requestIp = forwardedFor ?? request.headers.get('x-real-ip') ?? undefined

      await logUserActivity({
        userId: session.user.id,
        action: 'POST_DELETE_UNAUTHORIZED',
        ip: requestIp,
        userAgent: request.headers.get('user-agent') ?? undefined,
        metadata: {
          slug,
          postId: post.id,
          role: session.user.role,
        },
      })

      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete metadata first (cascade will handle this automatically)
    await postRepository.delete(post.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    )
  }
} 