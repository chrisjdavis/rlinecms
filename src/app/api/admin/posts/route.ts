import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { postRepository } from "@/lib/repositories/postRepository"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '9', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const [posts, total] = await Promise.all([
      postRepository.findAll({
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
          excerpt: true,
          author: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      postRepository.count()
    ])
    return NextResponse.json({ posts, total })
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
} 