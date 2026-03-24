import { getSiteConfig } from '@/lib/site';
import { getNavigation } from '@/lib/navigation';
import { ArchiveLayout } from '@/components/theme/minimal/ArchiveLayout'

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function ArchivePage() {
  const [site, navigation] = await Promise.all([
    getSiteConfig(),
    getNavigation()
  ]);

  return <ArchiveLayout site={site} navigation={navigation} />;
} 