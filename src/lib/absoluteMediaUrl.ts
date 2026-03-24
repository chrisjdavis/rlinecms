/**
 * Canonical public origin for this CMS (no trailing slash).
 * Prefer NEXT_PUBLIC_APP_URL so API responses work when consumed from another origin.
 */
export function getCmsPublicOrigin(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")
  if (fromEnv) return fromEnv

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`

  return new URL(req.url).origin
}

/**
 * Fully qualified URL for API consumers. Leaves http(s) and data URLs unchanged.
 */
export function toAbsoluteMediaUrl(url: string, origin: string): string {
  const t = url.trim()
  if (!t) return t
  if (t.startsWith("http://") || t.startsWith("https://")) return t
  if (t.startsWith("data:")) return t
  if (t.startsWith("//")) {
    try {
      const o = new URL(origin)
      return `${o.protocol}${t}`
    } catch {
      return `https:${t}`
    }
  }
  const path = t.startsWith("/") ? t : `/${t}`
  const base = origin.replace(/\/$/, "")
  return `${base}${path}`
}

/**
 * Map each screenshot `url` to an absolute URL; other product fields unchanged.
 * Accepts any product shape from Prisma (destructuring can widen types).
 */
export function withAbsoluteScreenshotUrls<T>(product: T, origin: string): T {
  if (!product || typeof product !== "object") return product
  const p = product as Record<string, unknown>
  const screenshots = p.screenshots
  if (!Array.isArray(screenshots)) return product
  return {
    ...p,
    screenshots: screenshots.map((s) => {
      if (!s || typeof s !== "object") return s
      const row = s as Record<string, unknown>
      const url = row.url
      if (typeof url !== "string") return s
      return { ...row, url: toAbsoluteMediaUrl(url, origin) }
    }),
  } as T
}
