import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Status } from '@prisma/client'
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '9', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Test direct Prisma query
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { status: Status.PUBLISHED },
          {
            status: Status.SCHEDULED,
            scheduledAt: {
              lte: new Date()
            }
          }
        ]
      },
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
        author: {
          select: {
            name: true,
            email: true,
            id: true,
            username: true
          }
        },
        metadata: true
      }
    })

    return NextResponse.json({ 
      posts,
      debug: {
        queryParams: { limit, offset },
        postCount: posts.length,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: "Debug endpoint failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
