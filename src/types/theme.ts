import { Block } from '@/components/block-editor'
import { ComponentType } from 'react'

export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  foreground: string
  muted: string
  text: string
  accent: string
  primaryForeground: string
  secondaryForeground: string
  mutedForeground: string
  border: string
}

export interface ThemeTypography {
  fontFamily: string
  fontSize: string
  lineHeight: string
  headingFont: string
  bodyFont: string
  monoFont: string
}

export interface ThemeSpacing {
  small: string
  medium: string
  large: string
  base: number
  scale: number
}

export interface ThemeComponents {
  article?: {
    paragraph?: {
      marginTop?: string
      marginBottom?: string
    }
  }
}

export interface ThemeTemplate {
  content: string;
  name: string;
}

export interface ThemeConfig {
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
  components?: ThemeComponents
  borderRadius: {
    small: string
    medium: string
    large: string
  }
  container: {
    maxWidth: string
    padding: string
  }
  styles: {
    prose: {
      p: {
        marginTop: string
        marginBottom: string
      }
    }
  }
  templates: {
    index: ThemeTemplate
    post: ThemeTemplate
    page: ThemeTemplate
  }
}

export interface Theme {
  id: string
  name: string
  description?: string
  version: string | null
  author: string | null
  isPublic: boolean
  isActive: boolean
  themePath: string
  config: ThemeConfig
  styles: string
  templates: {
    index: ThemeTemplate
    post: ThemeTemplate
    page: ThemeTemplate
  }
}

export interface Author {
  name?: string | null
  email?: string | null
}

export interface Post {
  id: string
  title: string
  content: string | Record<string, Block> | Block[]
  author?: Author | null
  createdAt: string
  slug: string
  excerpt?: string | null
  authorAgeInDays?: number
}

export interface Page {
  id: string
  title: string
  content: string | Record<string, Block> | Block[]
  slug: string
  createdAt?: string
  authorAgeInDays?: number
}

export interface Site {
  title: string
  description?: string
  theme?: string
  startDate?: string
  analyticsSnippet?: string
}

export interface ThemePageProps {
  page: Page
  site: Site
  navigation?: {
    header: { label: string; url: string }[];
    footer: { label: string; url: string }[];
  }
}

export interface ThemePostProps {
  site: Site
  post: {
    id: string
    title: string
    slug: string
    content: Block[]
    excerpt?: string | null
    author: {
      name: string
      email?: string
      avatar?: string | null
      id?: string
      username?: string
    }
    createdAt: string
    metadata?: Record<string, { value: string | number | boolean | Record<string, unknown>; type: string }>
    authorAgeInDays?: number
  }
  navigation?: {
    header: { label: string; url: string }[]
    footer: { label: string; url: string }[]
  }
  prevPost?: { slug: string; title: string } | null
  nextPost?: { slug: string; title: string } | null
}

export interface ThemeIndexProps {
  posts: Post[]
  site: Site
  navigation?: {
    header: { label: string; url: string }[]
    footer: { label: string; url: string }[]
  }
}

export type ThemePageComponent = ComponentType<ThemePageProps>
export type ThemePostComponent = ComponentType<ThemePostProps>
export type ThemeIndexComponent = ComponentType<ThemeIndexProps>

export type { 
  ThemePageComponent as PageComponent, 
  ThemePostComponent as PostComponent, 
  ThemeIndexComponent as IndexComponent 
}

// Template context types
export interface BaseTemplateContext {
  site: {
    title: string;
    description: string;
  };
  theme: ThemeConfig;
}

export interface IndexTemplateContext extends BaseTemplateContext {
  posts: Array<{
    id: string;
    title: string;
    excerpt?: string;
    slug: string;
    createdAt: string;
    author?: {
      name: string;
      email: string;
    };
  }>;
}

export interface PostTemplateContext extends BaseTemplateContext {
  post: {
    id: string;
    title: string;
    content: string | Record<string, Block>;
    excerpt?: string;
    slug: string;
    createdAt: string;
    author?: {
      name: string;
      email: string;
    };
  };
}

export interface PageTemplateContext extends BaseTemplateContext {
  page: {
    id: string;
    title: string;
    content: string | Record<string, Block>;
    slug: string;
    createdAt: string;
  };
} 