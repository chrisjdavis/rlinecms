import { NextResponse } from "next/server"
import { postRepository } from "@/lib/repositories/postRepository"
import { pageRepository } from "@/lib/repositories/pageRepository"

// Abuse protection: per-IP rate limit for unauthenticated search
const searchRateLimitMap = new Map<string, { count: number; windowStart: number }>()
const SEARCH_RATE_LIMIT = 60
const SEARCH_RATE_WINDOW_MS = 60 * 1000 // 1 minute

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown"
  return request.headers.get("x-real-ip") ?? "unknown"
}

export async function GET(request: Request) {
  const clientIp = getClientIp(request)
  const now = Date.now()
  const entry = searchRateLimitMap.get(clientIp)
  if (entry) {
    if (now - entry.windowStart >= SEARCH_RATE_WINDOW_MS) {
      searchRateLimitMap.set(clientIp, { count: 1, windowStart: now })
    } else if (entry.count >= SEARCH_RATE_LIMIT) {
      return NextResponse.json(
        { error: "Too many search requests. Please try again later.", results: [] },
        { status: 429 }
      )
    } else {
      entry.count++
      searchRateLimitMap.set(clientIp, entry)
    }
  } else {
    searchRateLimitMap.set(clientIp, { count: 1, windowStart: now })
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const [posts, pages] = await Promise.all([
      // Search posts
      postRepository.findAll({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { excerpt: { contains: query, mode: 'insensitive' } }
          ],
          status: 'PUBLISHED'
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      // Search pages
      pageRepository.findAll({
        where: {
          title: { contains: query, mode: 'insensitive' },
          status: 'PUBLISHED'
        },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Format the results
    const formattedResults = [
      ...posts.map(post => ({
        type: 'post',
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        createdAt: post.createdAt
      })),
      ...pages.map(page => ({
        type: 'page',
        title: page.title,
        slug: page.slug,
        excerpt: '',
        createdAt: page.createdAt
      }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return NextResponse.json({ results: formattedResults })
  } catch (error) {
    console.error("[SEARCH_ERROR]", error)
    return NextResponse.json(
      { error: "Search failed", results: [] },
      { status: 500 }
    )
  }
} 