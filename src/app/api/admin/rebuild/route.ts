import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { rebuildLogRepository } from '@/lib/repositories/rebuildLogRepository'
import { logUserActivity } from '@/lib/activityLog'

export async function POST() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    await rebuildLogRepository.create({
      user: { connect: { id: session.user.id } },
      action: "manual"
    })

    // Log the activity
    await logUserActivity({
      userId: session.user.id,
      action: 'rebuild_triggered',
      ip: undefined, // No request object available
      userAgent: undefined,
      metadata: {
        rebuildType: 'manual',
      },
    });

    return NextResponse.json({ message: "Rebuild triggered" })
  } catch {
    return NextResponse.json({ error: "Failed to trigger rebuild" }, { status: 500 })
  }
} 