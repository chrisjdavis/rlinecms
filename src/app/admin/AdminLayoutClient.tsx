"use client"

import { useEffect, useState } from "react"
import { Session } from "next-auth"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, TentTree, FileText, User, MessageSquare, File, Users, X, Settings, Home, List, Clock, HelpCircle, Megaphone, Key, Layers, Puzzle, Palette, LayoutGrid, type LucideIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { background, textColor, flex, typography } from '@/components/theme/admin'

/** Map icon name (from server/module manifest) to Lucide component. */
const NAV_ICONS: Record<string, LucideIcon> = {
  TentTree,
  FileText,
  MessageSquare,
  File,
  Users,
  List,
  Layers,
  HelpCircle,
  Megaphone,
  Key,
  Settings,
  Clock,
  Puzzle,
  Palette,
  LayoutGrid,
}

export interface AdminNavItem {
  name: string
  href: string
  icon: string
}

function UserMenu({
  user,
}: {
  user: Session["user"]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12 cursor-pointer rounded-full">
          <Avatar className="h-12 w-12">
            {user?.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name || user.email || "User"} />
            ) : (
              <AvatarFallback>
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className={flex({ direction: 'col', gap: 'sm' })}>
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className={cn("text-xs leading-none", textColor({ tone: 'muted' }))}>
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/" className="cursor-pointer">
            <Home className="mr-2 h-4 w-4" />
            <span>View Site</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/settings" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <div
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn("cursor-pointer")}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function AdminLayoutClient({
  children,
  session,
  navigation,
  needsFirstRunSetup = false,
}: {
  children: React.ReactNode
  session: Session
  navigation: AdminNavItem[]
  needsFirstRunSetup?: boolean
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const user = session.user
  const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "RLine"

  const isSetupRoute = pathname === "/admin/setup"
  const mustRedirectToSetup = needsFirstRunSetup && !isSetupRoute
  const isSetupMode = needsFirstRunSetup && isSetupRoute

  useEffect(() => {
    if (mustRedirectToSetup) {
      router.replace("/admin/setup")
    }
  }, [mustRedirectToSetup, router])

  if (mustRedirectToSetup) {
    return (
      <div
        className={cn(
          background({ tone: 'primary' }),
          "min-h-screen flex items-center justify-center",
        )}
      >
        <p className={cn(typography({ size: 'sm' }), textColor({ tone: 'muted' }))}>
          Opening setup…
        </p>
      </div>
    )
  }

  if (isSetupMode) {
    return (
      <div className={cn(background({ tone: 'primary' }), "min-h-screen flex flex-col")}>
        <header
          className={cn(
            "sticky top-0 z-10 h-16 border-b w-full shrink-0",
            background({ tone: 'primary' }),
            flex({ align: 'center', justify: 'between' }),
            "px-4 lg:px-6",
          )}
        >
          <span className="text-lg font-semibold tracking-tight">{appName}</span>
          <UserMenu user={user} />
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    )
  }

  return (
    <div className={cn(background({ tone: 'primary' }), "min-h-screen flex")}>
      {/* Desktop sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-64 lg:block",
          background({ tone: 'card' }),
          "border-r"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className={cn(
            "h-20 border-b w-full px-4 flex items-center justify-center gap-2"
          )}>
            <span className={cn("text-[32px] font-semibold h-8 leading-none flex items-center")}
                  style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
              {appName}
            </span>
            <span className={cn("text-white font-semibold text-sm bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center")}>
              C
            </span>
            <span className={cn("text-white font-semibold text-sm bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center")}>
              M
            </span>
            <span className={cn("text-white font-semibold text-sm bg-green-500 w-8 h-8 rounded-full flex items-center justify-center")}>
              S
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    flex({ align: 'center' }),
                    "rounded-md px-3 py-2 text-sm font-medium w-full",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : cn(
                          textColor({ tone: 'muted' }),
                          background({ tone: 'card', hover: true }),
                          "hover:text-accent-foreground"
                        )
                  )}
                >
                  {(() => {
                const Icon = NAV_ICONS[item.icon] ?? File
                return (
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-primary-foreground" : textColor({ tone: 'muted' })
                    )}
                  />
                )
              })()}
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="fixed inset-0 z-40 lg:hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 w-64 transform transition-transform duration-200 ease-in-out",
            background({ tone: 'card' }),
            "border-r",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Sidebar header */}
            <div className={cn(
              "h-14 border-b w-full px-4",
              flex({ align: 'center', justify: 'between' })
            )}>
              <div className={flex({ align: 'center', gap: 'sm' })}>
                <svg width="60" height="60" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 30 H65" stroke="#2563eb" strokeWidth="8" strokeLinecap="round"/>
                  <path d="M40 30 V90" stroke="#2563eb" strokeWidth="8" strokeLinecap="round"/>
                  <circle cx="40" cy="90" r="7" fill="#2563eb"/>
                  <path d="M55 60 V100 H80" stroke="#22c55e" strokeWidth="8" strokeLinecap="round"/>
                  <circle cx="55" cy="60" r="7" fill="#22c55e"/>
                </svg>
                <span className={cn("text-2xl font-semibold")}
                      style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  {appName}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      flex({ align: 'center' }),
                      "rounded-md px-3 py-2 text-sm font-medium w-full",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : cn(
                            textColor({ tone: 'muted' }),
                            background({ tone: 'card', hover: true }),
                            "hover:text-accent-foreground"
                          )
                    )}
                  >
                  {(() => {
                const Icon = NAV_ICONS[item.icon] ?? File
                return (
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-primary-foreground" : textColor({ tone: 'muted' })
                    )}
                  />
                )
              })()}
                  {item.name}
                </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content wrapper */}
      <div className="flex-1 lg:pl-64">
        {/* Header */}
        <header className={cn(
          "sticky top-0 z-10 h-20 border-b w-full",
          background({ tone: 'primary' }),
          flex({ align: 'center', justify: 'between' }),
          "px-4 lg:px-6"
        )}>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <TentTree className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <div className="flex-1" />
          <UserMenu user={user} />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
} 