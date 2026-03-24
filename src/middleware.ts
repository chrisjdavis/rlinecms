import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { Role } from "@prisma/client"
import moduleRoutePaths from "@/lib/modules/route-paths.generated.json"

// Core route configurations; module routes (public + admin) merged from generated list
const corePublicRoutes = [
  "/login",
  "/register",
  "/feed.xml",
  "/api/lastfm",
  "/api/search",
  "/api/posts",
  "/posts/",
  "/themes/",
  "/timeline",
]
const publicRoutes = [...corePublicRoutes, ...(moduleRoutePaths.publicApiPaths as string[])]

const coreAdminRoutes = [
  "/admin/setup",
  "/admin/settings",
  "/admin/users",
  "/admin/posts",
  "/admin/pages",
  "/admin/rebuild",
  "/admin/extensions",
  "/admin/themes",
]
const adminRoutes = [...coreAdminRoutes, ...(moduleRoutePaths.adminPaths as string[])]

const moderatorRoutes = [
  '/admin/comments'
]

const authRoutes = ["/api/auth/sessions", "/api/upload"]

function matchesPath(path: string, patterns: string[]): boolean {
  return patterns.some(
    (pattern) =>
      path.startsWith(pattern) ||
      (pattern.includes("*") &&
        new RegExp("^" + pattern.replace("*", ".*") + "$").test(path)),
  )
}

function hasAtLeastModerator(role?: Role): boolean {
  // This codebase currently defines roles: USER, ADMIN, COMMENTER.
  // Treat COMMENTER as the moderator-equivalent role.
  return role === Role.ADMIN || role === Role.COMMENTER
}

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Add security headers
  const response = NextResponse.next()

  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  )
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  )
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  )
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  )
  response.headers.set("X-DNS-Prefetch-Control", "off")
  response.headers.set("X-Download-Options", "noopen")
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none")

  // Allow public routes
  if (matchesPath(path, publicRoutes)) {
    return response
  }

  // Verify authentication via cryptographically signed NextAuth JWT.
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuthenticated = !!token?.id
  const role = token?.role as Role | undefined

  // Require authentication for auth routes
  if (matchesPath(path, authRoutes)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    return response
  }

  // Moderator UI routes (subset of /admin)
  if (matchesPath(path, moderatorRoutes)) {
    if (!isAuthenticated || !hasAtLeastModerator(role)) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    return response
  }

  // Admin route group (UI + API)
  if (matchesPath(path, adminRoutes)) {
    if (!isAuthenticated) {
      // UI vs API behavior
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/login", req.url))
    }

    if (role !== Role.ADMIN) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return response
  }

  // Handle other API routes
  if (path.startsWith("/api/")) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    // Protected API routes
    "/api/:path*",

    // Protected admin routes
    "/admin/:path*",

  ],
}
