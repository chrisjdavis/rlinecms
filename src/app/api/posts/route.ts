import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { Block } from '@/components/block-editor'
import { Metadata } from '@/components/ui/metadata-editor'
import { fetchWeatherAndMusic } from '@/lib/metadata'
import { revalidateTag } from 'next/cache'
import * as z from "zod"
import { Status } from '@prisma/client'
import { postRepository } from '@/lib/repositories/postRepository'
import { logUserActivity } from '@/lib/activityLog'

const postSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  content: z.record(z.string(), z.unknown()),
  excerpt: z.string().max(500).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.array(z.object({ key: z.string(), value: z.unknown(), type: z.string() })).optional()
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '9', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Simplified: only published posts (like /api/posts/all)
    const where = {
      status: Status.PUBLISHED,
      author: { is: { deletedAt: null } }
    };

    const posts = await postRepository.findAll({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        excerpt: true,
        content: true,
        blocks: {
          orderBy: { order: 'asc' as const },
          select: { id: true, type: true, content: true, order: true }
        },
        author: {
          select: {
            name: true,
            email: true,
            avatar: true,
            id: true,
            username: true
          }
        },
        metadata: true
      }
    })

    // Shape content for client: use blocks if present (full article for read time), else legacy content
    const postsWithContent = posts.map((post) => {
      const p = post as typeof post & { blocks?: Array<{ id: string; type: string; content: unknown; order: number }>; content?: unknown }
      const content = p.blocks?.length ? p.blocks : p.content
      const { blocks: _blocks, ...rest } = p
      return { ...rest, content }
    })

    return NextResponse.json({ posts: postsWithContent })
  } catch (error) {
    console.error('Error in GET /api/posts:', error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Check for specific database connection errors
      if (error.message.includes('DATABASE_URL') || error.message.includes('connection')) {
        console.error('Database connection error detected');
        return NextResponse.json({
          error: "Database connection error",
          details: "Unable to connect to the database. Please check your DATABASE_URL environment variable."
        }, { status: 500 });
      }

      // Check for Prisma-specific errors
      if (error.message.includes('prisma') || error.message.includes('Prisma')) {
        console.error('Prisma error detected');
        return NextResponse.json({
          error: "Database query error",
          details: error.message
        }, { status: 500 });
      }
    }

    // Generic error response
    return NextResponse.json({
      error: "Failed to fetch posts",
      details: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { title, slug, content, excerpt, status, scheduledAt, metadata = [] } = await req.json()

    if (!title || !slug) {
      return NextResponse.json(
        { message: "Title and slug are required" },
        { status: 400 }
      )
    }

    const parsed = postSchema.safeParse({ title, slug, content, excerpt, status, scheduledAt, metadata })
    if (!parsed.success) {
      console.error("Validation errors:", parsed.error.flatten())
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.flatten() }, { status: 400 })
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

    // Only fetch weather and music data for drafts
    const combinedMetadata = [...metadata];
    if (status === 'DRAFT') {
      const autoMetadata = await fetchWeatherAndMusic();

      // Filter out any auto-metadata that might already exist
      const existingKeys = new Set(metadata.map((m: Metadata) => m.key));

      const newAutoMetadata = autoMetadata.filter((m: Metadata) => !existingKeys.has(m.key));

      combinedMetadata.push(...newAutoMetadata);
    }

    // Debug: log combinedMetadata before creation
    console.log('Creating post with metadata:', JSON.stringify(combinedMetadata, null, 2));
    if (combinedMetadata.some(meta => !meta.key || !meta.type)) {
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
    }

    // Create the post with blocks and metadata
    const post = await postRepository.create(
      {
        title,
        slug,
        content,
        excerpt,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        author: { connect: { id: session.user.id } },
        blocks: {
          create: Object.values(content)
            .filter(isBlock)
            .map((block) => ({
              id: block.id,
              type: block.type,
              content: block.content,
              order: block.order
            })),
        },
        metadata: combinedMetadata.length > 0 ? {
          create: Array.from(
            new Map(combinedMetadata.map(meta => [meta.key, meta])).values()
          ).map((meta: Metadata) => ({
            key: meta.key,
            value: meta.value,
            type: meta.type
          }))
        } : undefined,
      },
      {
        include: {
          blocks: true,
          metadata: true
        }
      }
    )

    // Log the activity
    await logUserActivity({
      userId: session.user.id,
      action: 'post_created',
      ip: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      metadata: {
        postId: post.id,
        postTitle: post.title,
        postSlug: post.slug,
        status: post.status,
        blockCount: Object.keys(content).length,
        metadataCount: combinedMetadata.length,
      },
    });

    // Revalidate the posts list and the individual post page
    revalidateTag('posts')
    revalidateTag(`post-${post.slug}`)
    return NextResponse.json(post, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}