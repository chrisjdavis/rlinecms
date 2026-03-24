import { PostLayout } from '@/components/theme/minimal/PostLayout'
import { getSiteConfig } from '@/lib/site'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Block, BlockType, BlockContent } from '@/components/block-editor'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getNavigation } from '@/lib/navigation'

interface PostMetadata {
  id: string
  key: string
  value: string | number | boolean | Record<string, unknown>
  type: string
}

interface PostWithAuthor {
  id: string
  title: string
  slug: string
  content: string | Record<string, Block>
  excerpt: string | null
  createdAt: Date
  author: {
    name: string | null
    id: string
    username: string | null
    avatar: string | null
    email: string | null
  }
  metadata: PostMetadata[]
  blocks: {
    id: string
    type: BlockType
    content: BlockContent
    order: number
  }[]
}

// Mark as dynamic to ensure fresh data
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session) {
    return {
      title: 'Unauthorized',
    }
  }
  
  const [post, site] = await Promise.all([
    prisma.post.findUnique({
      where: { slug },
      select: {
        title: true,
        excerpt: true
      }
    }),
    getSiteConfig()
  ])

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: `Preview: ${post.title} - ${site.title}`,
    description: post.excerpt || undefined,
  }
}

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login')
  }
  
  const [post, site, navigation] = await Promise.all([
    prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            name: true,
            id: true,
            username: true,
            avatar: true,
            email: true,
          }
        },
        blocks: {
          orderBy: {
            order: 'asc'
          }
        },
        metadata: true
      }
    }) as Promise<PostWithAuthor | null>,
    getSiteConfig(),
    getNavigation()
  ])

  if (!post) {
    notFound()
  }

  // Filter out metadata with empty values at the application level
  const validMetadata = post.metadata.filter(meta => {
    const value = meta.value;
    return value !== null && 
           value !== undefined && 
           value !== '' &&
           (typeof value === 'object' ? Object.keys(value).length > 0 : String(value).trim() !== '');
  });

  // Transform metadata array into keyed object
  const metadataObject = validMetadata.reduce<Record<string, { value: string | number | boolean | Record<string, unknown>, type: string }>>((acc, meta) => {
    acc[meta.key] = {
      value: meta.value,
      type: meta.type
    };
    return acc;
  }, {});

  // Convert blocks to content array format with proper markdown handling
  const content = post.blocks.map(block => ({
    id: block.id,
    type: block.type,
    content: block.content,
    order: block.order
  }));

  return (
    <PostLayout 
      site={site}
      navigation={navigation}
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        content,
        excerpt: post.excerpt || undefined,
        author: {
          name: post.author.name || 'Anonymous',
          id: post.author.id,
          username: post.author.username ?? undefined,
          avatar: post.author.avatar,
          email: post.author.email ?? undefined,
        },
        createdAt: post.createdAt.toISOString(),
        metadata: metadataObject
      }}
    />
  )
} 