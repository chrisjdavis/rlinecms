import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { 
  getActiveSessions, 
  revokeSession, 
  getCurrentSession
} from "@/lib/auth/session"
import { sessionRepository } from '@/lib/repositories/sessionRepository'

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const activeSessions = await getActiveSessions(session.user.id)
  return NextResponse.json(activeSessions)
}

export async function DELETE(request: Request) {
  const session = await auth()
  const currentSession = await getCurrentSession()
  
  if (!session?.user || !currentSession) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sessionToken = searchParams.get("sessionToken")
  const all = searchParams.get("all")

  try {
    if (all === "true") {
      // Revoke all sessions except current
      const sessions = await sessionRepository.findAll({
        where: {
          userId: session.user.id,
          NOT: {
            id: currentSession.id
          }
        }
      })
      
      for (const s of sessions) {
        await revokeSession(s.sessionToken)
      }
      
      return new NextResponse("All other sessions revoked", { status: 200 })
    } else if (sessionToken) {
      // Check if session belongs to user
      const targetSession = await sessionRepository.findByToken(sessionToken)
      
      if (!targetSession || targetSession.userId !== session.user.id) {
        return new NextResponse("Unauthorized", { status: 401 })
      }
      
      // Don't allow revoking current session
      if (targetSession.id === currentSession.id) {
        return new NextResponse("Cannot revoke current session", { status: 400 })
      }
      
      await revokeSession(targetSession.sessionToken)
      return new NextResponse("Session revoked", { status: 200 })
    }
    
    return new NextResponse("Invalid request", { status: 400 })
  } catch (error) {
    console.error("Error managing sessions:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 