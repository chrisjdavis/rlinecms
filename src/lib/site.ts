import { Site } from '@/types/theme'
import { themeRepository } from '@/lib/repositories/themeRepository'
import { siteSettingsRepository } from '@/lib/repositories/siteSettingsRepository'
import { postRepository } from '@/lib/repositories/postRepository'

const defaultConfig: Site = {
  title: 'RLine CMS',
  description: 'A minimal, text-forward site powered by RLine CMS',
  theme: 'minimal'
}

export async function getSiteConfig(): Promise<Site> {
  try {
    const [settings, theme, oldestPost] = await Promise.all([
      siteSettingsRepository.findFirst({
        orderBy: { updatedAt: 'desc' }
      }),
      themeRepository.findFirst({
        where: { isActive: true }
      }),
      postRepository.findOldest()
    ])

    return {
      title: settings?.title || defaultConfig.title,
      description: settings?.description || defaultConfig.description,
      theme: theme?.themePath || defaultConfig.theme,
      startDate: oldestPost?.createdAt?.toISOString() || undefined,
      analyticsSnippet: settings?.analyticsSnippet || undefined,
    }
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return defaultConfig
  }
} 