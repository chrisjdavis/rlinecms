import { notFound } from 'next/navigation'
import { getSiteConfig } from '@/lib/site'
import { BlockType, Block } from '@/components/block-editor'
import type { Page as ThemePageBase } from '@/types/theme'
import { getNavigation } from '@/lib/navigation'
import { Block as PrismaBlock } from '@prisma/client'
import { pageRepository } from '@/lib/repositories/pageRepository'
import type { PageWithAuthorAge } from '@/lib/repositories/pageRepository'
import PageLayout from '@/components/theme/minimal/PageLayout'

// Add this type at the top of the file (or near the imports)
type PageWithBlocks = PageWithAuthorAge & { blocks: PrismaBlock[] };

// Patch ThemePage type to allow createdAt and authorAgeInDays
type ThemePage = ThemePageBase & { createdAt?: string; authorAgeInDays?: number };

// Add generateMetadata export for dynamic title/description
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, site] = await Promise.all([
    pageRepository.findBySlug(slug),
    getSiteConfig()
  ]);
  return {
    title: page?.title ? `${page.title} | ${site.title}` : site.title,
    description: site.description,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, site, navigation] = await Promise.all([
    pageRepository.findBySlug(slug, {
      include: {
        blocks: {
          orderBy: {
            order: 'asc'
          }
        },
        metadata: true
      }
    }),
    getSiteConfig(),
    getNavigation()
  ])

  if (!page) {
    notFound()
  }

  // After fetching page, cast it to PageWithBlocks
  const typedPage = page as PageWithBlocks;

  // Handle content from either blocks or legacy content field
  let content: string | Record<string, Block> | Block[];
  
  if (typedPage.blocks && typedPage.blocks.length > 0) {
    // Use blocks if they exist
    content = typedPage.blocks.map((block: PrismaBlock) => ({
      id: block.id,
      type: block.type as BlockType,
      content: block.content as string | { url: string, alt: string },
      order: block.order
    }))
  } else {
    // Fallback to legacy content field
    content = page.content as string | Record<string, Block> | Block[]
  }

  const pageData: ThemePage = {
    id: page.id,
    title: page.title,
    content,
    slug: page.slug,
    createdAt: page.createdAt instanceof Date ? page.createdAt.toISOString() : page.createdAt,
    authorAgeInDays: page.authorAgeInDays
  }

  return <PageLayout page={pageData} site={site} navigation={navigation} />
} 