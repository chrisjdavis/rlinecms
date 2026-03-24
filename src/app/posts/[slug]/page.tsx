import { PostLayout } from '@/components/theme/minimal/PostLayout'
import { getSiteConfig } from '@/lib/site'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Block } from '@/components/theme/contentTypes'
import { Metadata } from 'next'
import { getNavigation } from '@/lib/navigation'
import { postRepository } from '@/lib/repositories/postRepository'

// Add this type at the top of the file (or near the imports)
type PostWithAuthorAndMetadata = {
  id: string;
  title: string;
  slug: string;
  content: Block[] | Record<string, Block> | string;
  excerpt?: string;
  author?: {
    name?: string;
    email?: string;
    avatar?: string | null;
    id?: string;
    username?: string;
  };
  createdAt: string;
  metadata?: MetadataItem[];
  authorAgeInDays?: number;
};

// Add this type after PostWithAuthorAndMetadata
type MetadataItem = {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  type: string;
};

// Function to detect if content is HTML
function isHtml(str: string): boolean {
  // Basic check for HTML tags
  const htmlRegex = /<[a-z][\s\S]*>/i;
  return htmlRegex.test(str);
}

// Mark as dynamic to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true }
  })
  
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  
  const [post, site] = await Promise.all([
    postRepository.findPublishedBySlug(slug, {
      select: {
        title: true,
        excerpt: true,
        slug: true,
        author: { select: { name: true, email: true, avatar: true } },
        metadata: true,
      },
    }),
    getSiteConfig(),
  ])

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const postUrl = `${baseUrl}/posts/${post.slug}`;
  let image = `${baseUrl}/default-og-image.jpg`;
  if (post.metadata) {
    const imageMeta = post.metadata.find(meta => meta.key === 'image');
    if (imageMeta && typeof imageMeta.value === 'string') {
      image = imageMeta.value;
    }
  }
  const author = post.author?.name || site.title;
  const description = post.excerpt || site.description;

  return {
    title: `${post.title} - ${site.title}`,
    description,
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url: postUrl,
      images: [image],
      siteName: site.title,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [image],
    },
    authors: [{ name: author }],
    alternates: {
      canonical: postUrl,
    },
    other: {
      'next-tags': ['posts', `post-${slug}`],
    },
  }
}

export default async function PostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const [post, site, navigation] = await Promise.all([
    postRepository.findPublishedBySlug(slug, {
      include: {
        author: {
          select: {
            name: true,
            email: true,
            avatar: true,
            id: true,
            username: true,
          },
        },
        blocks: {
          orderBy: {
            order: 'asc',
          },
        },
        metadata: true,
      },
    }),
    getSiteConfig(),
    getNavigation(),
  ])

  if (!post) {
    notFound()
  }

  // In the main function, after fetching post:
  const typedPost = { ...post, createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt } as PostWithAuthorAndMetadata;

  // Filter out metadata with empty values at the application level
  const validMetadata = (typedPost.metadata ?? []).filter((meta: MetadataItem) => {
    const value = meta.value;
    return value !== null && 
           value !== undefined && 
           value !== '' &&
           (typeof value === 'object' ? Object.keys(value).length > 0 : String(value).trim() !== '');
  });

  // Prefer normalized Block rows (same as GET /api/posts); else legacy JSON or string on Post.content
  const content: Block[] = (() => {
    const rows = post.blocks
    if (rows && rows.length > 0) {
      return rows.map((block) => ({
        id: block.id,
        type: block.type as Block['type'],
        content: block.content as Block['content'],
        order: block.order,
      }))
    }
    if (typeof post.content === 'object' && post.content !== null) {
      return Object.entries(post.content as unknown as Record<string, Block>)
        .map(([key, block]) => ({
          ...block,
          id: block.id || `block-${key}`,
        }))
        .sort((a, b) => a.order - b.order)
    }
    if (typeof post.content === 'string') {
      return [
        {
          id: `block-${Date.now()}`,
          type: (isHtml(post.content) ? 'html' : 'text') as Block['type'],
          content: post.content,
          order: 0,
        },
      ]
    }
    return []
  })()

  // Transform metadata array into keyed object
  const metadataObject = (validMetadata as MetadataItem[]).reduce<Record<string, { value: string | number | boolean | Record<string, unknown>, type: string }>>((acc, meta) => {
    acc[meta.key] = {
      value: meta.value,
      type: meta.type
    };
    return acc;
  }, {});

  // Find previous and next posts by createdAt
  const prevPostData = await prisma.post.findFirst({
    where: {
      status: 'PUBLISHED',
      createdAt: { lt: post.createdAt },
    },
    orderBy: { createdAt: 'desc' },
    select: { slug: true, title: true },
  });
  const nextPostData = await prisma.post.findFirst({
    where: {
      status: 'PUBLISHED',
      createdAt: { gt: post.createdAt },
    },
    orderBy: { createdAt: 'asc' },
    select: { slug: true, title: true },
  });

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
          name: typedPost.author?.name || 'Anonymous',
          email: typedPost.author?.email,
          avatar: typedPost.author?.avatar,
          id: typedPost.author?.id,
          username: typedPost.author?.username || undefined
        },
        createdAt: typedPost.createdAt,
        metadata: metadataObject,
        authorAgeInDays: post.authorAgeInDays
      }}
      prevPost={prevPostData || undefined}
      nextPost={nextPostData || undefined}
    />
  )
}