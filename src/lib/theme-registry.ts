import { IndexComponent, PageComponent, PostComponent } from '@/types/theme'

export type ThemeTemplate = 'Index' | 'Post' | 'Page'
export type ThemeComponent = IndexComponent | PageComponent | PostComponent

/** Single dynamic segment (themeId) so bundler can resolve; template is static per branch. */
export async function getThemeComponent(themePath: string, template: ThemeTemplate): Promise<{ default: ThemeComponent }> {
  const themeId = themePath.split('/').pop()
  switch (template) {
    case 'Index':
      return import(`@/components/theme/${themeId}/IndexLayout.tsx`)
    case 'Post':
      return import(`@/components/theme/${themeId}/PostLayout.tsx`)
    case 'Page':
      return import(`@/components/theme/${themeId}/PageLayout.tsx`)
    default: {
      const _: never = template
      return import(`@/components/theme/${themeId}/IndexLayout.tsx`)
    }
  }
}
