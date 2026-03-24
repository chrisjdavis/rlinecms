import { sessionRepository } from '@/lib/repositories/sessionRepository'
import { auth } from "@/lib/auth"

export async function revokeAllUserSessions(userId: string) {
  await sessionRepository.deleteMany({
    where: { userId }
  })
}

export async function getActiveSessions(userId: string) {
  return sessionRepository.findAll({ where: { userId } });
}

export async function revokeSession(sessionToken: string) {
  await sessionRepository.deleteByToken(sessionToken);
}

export async function updateSessionExpiry(sessionToken: string, newExpiry: Date) {
  await sessionRepository.updateByToken(sessionToken, { expires: newExpiry });
}

export async function cleanupInactiveSessions(olderThan: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
  await sessionRepository.deleteMany({ where: { expires: { lt: olderThan } } });
}

export async function getCurrentSession() {
  const session = await auth()
  if (!session?.user?.id) return null
  
  return sessionRepository.findFirst({ where: { userId: session.user.id } });
}

export async function extendSession(sessionToken: string) {
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await updateSessionExpiry(sessionToken, thirtyDays)
} 