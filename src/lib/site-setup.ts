import { prisma } from '@/lib/prisma'

/** True when no site settings row exists (fresh database / before first admin configuration). */
export async function isFirstRunSetupRequired(): Promise<boolean> {
  const row = await prisma.siteSettings.findFirst({
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })
  return row === null
}
