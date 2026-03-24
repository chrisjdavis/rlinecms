export interface Site {
  title: string
  description?: string
  startDate?: string
  analyticsSnippet?: string
}

export interface Post {
  id: string
  title: string
  slug: string
  content: Block[]
  excerpt?: string
  author: {
    name: string
    email?: string
    avatar?: string | null
    id?: string
    username?: string
  }
  createdAt: string
  metadata: Record<
    string,
    {
      value: string | number | boolean | Record<string, unknown>
      type: string
    }
  >
  authorAgeInDays?: number
}

export interface Page {
  id: string
  title: string
  slug: string
  content: string | Record<string, Block> | Block[]
  createdAt?: string
  authorAgeInDays?: number
}

export type BlockType =
  | 'text'
  | 'heading'
  | 'code'
  | 'image'
  | 'html'
  | 'markdown'
  | 'quote'

export interface Block {
  id: string
  type: BlockType
  content: string | ImageContent
  order: number
  language?: string
}

export interface ImageContent {
  url: string
  alt?: string
}

export interface ThemePagePropsLocal {
  site: Site
  page: Page
}

export interface PostProps {
  post: {
    id: string
    title: string
    slug: string
    content: Block[]
    excerpt?: string
    author: {
      name: string
      email?: string
      avatar?: string | null
      id?: string
      username?: string
    }
    createdAt: string
    metadata: Record<
      string,
      {
        value: string | number | boolean | Record<string, unknown>
        type: string
      }
    >
    authorAgeInDays?: number
  }
  site: {
    title: string
    description?: string
  }
  navigation?: {
    header: { label: string; url: string }[]
    footer: { label: string; url: string }[]
  }
}
