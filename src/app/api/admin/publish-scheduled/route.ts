import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Status } from "@prisma/client"

export async function POST(req: Request) {
  try {
    // Verify the request has proper authorization
    // You can add a secret token check here for additional security
    const authHeader = req.headers.get('authorization')
    const expectedToken = process.env.SCHEDULER_SECRET_TOKEN
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find all scheduled posts that should be published
    const now = new Date()
    const scheduledPosts = await prisma.post.findMany({
      where: {
        status: Status.SCHEDULED,
        scheduledAt: {
          lte: now
        }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        scheduledAt: true
      }
    })

    if (scheduledPosts.length === 0) {
      return NextResponse.json({ 
        message: "No posts to publish", 
        published: 0 
      })
    }

    // Publish each scheduled post
    const publishPromises = scheduledPosts.map(post => 
      prisma.post.update({
        where: { id: post.id },
        data: {
          status: Status.PUBLISHED,
          scheduledAt: null
        }
      })
    )

    await Promise.all(publishPromises)

    console.log(`Published ${scheduledPosts.length} scheduled posts:`, 
      scheduledPosts.map(p => p.title))

    return NextResponse.json({ 
      message: `Successfully published ${scheduledPosts.length} posts`,
      published: scheduledPosts.length,
      posts: scheduledPosts.map(p => ({ title: p.title, slug: p.slug }))
    })

  } catch (error) {
    console.error("Error publishing scheduled posts:", error)
    return NextResponse.json(
      { error: "Failed to publish scheduled posts" }, 
      { status: 500 }
    )
  }
} 