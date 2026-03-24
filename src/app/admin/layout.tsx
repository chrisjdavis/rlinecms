import '../globals.css'
import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import AdminLayoutClient from "./AdminLayoutClient"
import { getModuleNavItems } from "@/lib/modules/registry"
import { isFirstRunSetupRequired } from "@/lib/site-setup"

/** Core admin nav items (icon as string for client mapping). Extension nav items are merged from enabled modules. */
function getCoreNavItems(isAdmin: boolean): { name: string; href: string; icon: string }[] {
  const base = [
    { name: "Dashboard", href: "/admin", icon: "TentTree" },
    { name: "Comments", href: "/admin/comments", icon: "MessageSquare" },
  ]
  if (!isAdmin) return base
  return [
    ...base,
    { name: "Activity Log", href: "/admin/activity-log", icon: "List" },
    { name: "Posts", href: "/admin/posts", icon: "FileText" },
    { name: "Pages", href: "/admin/pages", icon: "File" },
    { name: "Projects", href: "/admin/projects", icon: "Layers" },
    { name: "Users", href: "/admin/users", icon: "Users" },
    { name: "API Keys", href: "/admin/api-keys", icon: "Key" },
    { name: "Extensions", href: "/admin/extensions", icon: "Puzzle" },
    { name: "Minimal theme", href: "/admin/themes", icon: "Palette" },
    { name: "Settings", href: "/admin/settings", icon: "Settings" },
    { name: "Cron Jobs", href: "/admin/cron-jobs", icon: "Clock" },
  ]
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "ADMIN"
  const needsFirstRunSetup = isAdmin && (await isFirstRunSetupRequired())
  const coreNav = getCoreNavItems(isAdmin)
  const moduleNav = await getModuleNavItems()
  // Insert module nav items before Settings and Cron Jobs (after Users, API Keys)
  const settingsIndex = coreNav.findIndex((n) => n.href === "/admin/settings")
  const navigation =
    settingsIndex >= 0
      ? [...coreNav.slice(0, settingsIndex), ...moduleNav, ...coreNav.slice(settingsIndex)]
      : [...coreNav, ...moduleNav]

  return (
    <AdminLayoutClient
      session={session}
      navigation={navigation}
      needsFirstRunSetup={needsFirstRunSetup}
    >
      {children}
    </AdminLayoutClient>
  )
} 