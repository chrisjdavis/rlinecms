import { siteSettingsRepository } from '@/lib/repositories/siteSettingsRepository'
import type { SiteSettings, NavigationItem as PrismaNavigationItem } from '@prisma/client'

export interface NavigationItem {
  label: string
  url: string
  order: number
}

export async function getNavigation() {
  const settings = await siteSettingsRepository.findFirst({
    orderBy: { updatedAt: 'desc' },
    include: {
      navigation: {
        orderBy: { order: 'asc' }
      }
    }
  }) as (SiteSettings & { navigation: PrismaNavigationItem[] }) | null

  const headerItems = settings?.navigation
    .filter(item => item.location === 'HEADER')
    .map(({ label, url, order }) => ({ label, url, order })) || []

  const footerItems = settings?.navigation
    .filter(item => item.location === 'FOOTER')
    .map(({ label, url, order }) => ({ label, url, order })) || []

  return {
    header: headerItems,
    footer: footerItems
  }
} 