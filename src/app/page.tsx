import { IndexLayout } from '@/components/theme/minimal/IndexLayout'
import { getSiteConfig } from '@/lib/site'
import { getNavigation } from '@/lib/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata() {
  const site = await getSiteConfig()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return {
    title: site.description,
    description: site.description,
    openGraph: {
      type: 'website',
      title: site.description,
      description: site.description,
      url: baseUrl,
      images: [`${baseUrl}/default-og-image.jpg`],
    },
    twitter: {
      card: 'summary_large_image',
      title: site.description,
      description: site.description,
      images: [`${baseUrl}/default-og-image.jpg`],
    },
    authors: [
      { name: process.env.NEXT_PUBLIC_SITE_AUTHOR?.trim() || 'Site author' },
    ],
  }
}

export default async function HomePage() {
  const [site, navigation] = await Promise.all([
    getSiteConfig(),
    getNavigation(),
  ])
  return (
    <IndexLayout
      site={site}
      navigation={navigation}
    />
  )
}
