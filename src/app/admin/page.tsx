import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { WeatherCard } from "@/components/ui/weather-card"
import { getCloudflareAnalytics } from '@/lib/cloudflare-analytics'
import { AnalyticsCard } from "@/components/ui/analytics-card"
import { SiteHealthCard, SiteHealthData } from "@/components/ui/site-health-card"
import { getSiteAge } from "@/lib/site-age"
import { ActivityCard } from "@/components/ui/activity-card"
import { heading, typography, section } from '@/components/theme/admin'
import { cn } from '@/lib/utils'

function formatLastRebuild(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } else {
    return date.toLocaleDateString();
  }
}

export default async function AdminDashboard() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const settings = await prisma.siteSettings.findFirst({
    orderBy: { updatedAt: 'desc' }
  })

  // Fetch Cloudflare analytics
  let analytics = null
  try {
    analytics = await getCloudflareAnalytics()
  } catch {
    analytics = null
  }

  // Calculate 48 hours ago
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  // Fetch new users, comments, and posts in the last 48 hours
  const [newUsers, newComments, newPosts] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.comment.count({ where: { createdAt: { gte: since } } }),
    prisma.post.count({ where: { createdAt: { gte: since }, status: 'PUBLISHED' } })
  ]);

  // Fetch site health data
  const [siteAge, lastRebuild] = await Promise.all([
    getSiteAge(),
    prisma.rebuildLog.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
  ])

  const health: SiteHealthData = {
    siteAge: siteAge ? `${siteAge.years > 0 ? siteAge.years + 'Y ' : ''}${siteAge.months > 0 ? siteAge.months + 'M ' : ''}${siteAge.days}D` : null,
    lastRebuild: lastRebuild ? formatLastRebuild(String(lastRebuild.createdAt)) : null,
    settingsOk: Boolean(settings?.title && settings?.userId),
    aiIntegrationOk: Boolean(settings?.aiKey),
  }

  return (
    <div className={section({ spacing: 'lg' })}>
      <div>
        <h2 className={heading({ level: 'h1' })}>Dashboard</h2>
        <p className={cn(
          typography({ size: 'lg' }),
          "text-muted-foreground"
        )}>
          Welcome back, {session.user?.name || session.user?.email}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1">
          <WeatherCard
            latitude={settings?.latitude ?? undefined}
            longitude={settings?.longitude ?? undefined}
            location={settings?.location ?? undefined}
          />
        </div>
        <div className="col-span-1">
          <AnalyticsCard analytics={analytics} />
        </div>
        <div className="col-span-1">
          <ActivityCard users={newUsers} comments={newComments} posts={newPosts} />
        </div>
        <div className="col-span-1">
          <SiteHealthCard health={health} />
        </div>
      </div>
    </div>
  )
} 