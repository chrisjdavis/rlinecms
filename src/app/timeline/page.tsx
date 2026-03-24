import { getSiteConfig } from '@/lib/site';
import { getNavigation } from '@/lib/navigation';
import { Layout } from '@/components/theme/minimal/Layout'
import Timeline from '@/components/Timeline';

export async function generateMetadata() {
  const site = await getSiteConfig();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const title = `Timeline - ${site.title}`;
  const description = 'A chronological view of all published posts.';
  const url = `${baseUrl}/timeline`;
  const image = `${baseUrl}/default-og-image.jpg`;
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      images: [image],
      siteName: site.title,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    authors: [
      { name: process.env.NEXT_PUBLIC_SITE_AUTHOR?.trim() || 'Site author' },
    ],
    alternates: {
      canonical: url,
    },
  };
}

export default async function TimelinePage() {
  const site = await getSiteConfig();
  const navigation = await getNavigation();

  return (
    <Layout site={site} navigation={navigation}>
      <div className="container mx-auto py-8">
        <Timeline />
      </div>
    </Layout>
  );
} 