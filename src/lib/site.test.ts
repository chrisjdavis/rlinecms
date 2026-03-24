import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { getSiteConfig } from "./site"
import { siteSettingsRepository } from "./repositories/siteSettingsRepository"
import { themeRepository } from "./repositories/themeRepository"
import { postRepository } from "./repositories/postRepository"

vi.mock("./repositories/siteSettingsRepository", () => ({
  siteSettingsRepository: { findFirst: vi.fn() },
}))

vi.mock("./repositories/themeRepository", () => ({
  themeRepository: { findFirst: vi.fn() },
}))

vi.mock("./repositories/postRepository", () => ({
  postRepository: { findOldest: vi.fn() },
}))

describe("getSiteConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("merges DB values with defaults", async () => {
    const created = new Date("2020-01-15T12:00:00.000Z")
    vi.mocked(siteSettingsRepository.findFirst).mockResolvedValue({
      title: "My Blog",
      description: "Tagline",
      analyticsSnippet: "<script></script>",
    } as any)
    vi.mocked(themeRepository.findFirst).mockResolvedValue({
      themePath: "minimal",
    } as any)
    vi.mocked(postRepository.findOldest).mockResolvedValue({
      createdAt: created,
    } as any)

    const site = await getSiteConfig()
    expect(site).toEqual({
      title: "My Blog",
      description: "Tagline",
      theme: "minimal",
      startDate: created.toISOString(),
      analyticsSnippet: "<script></script>",
    })
  })

  it("uses defaults when repositories return nothing", async () => {
    vi.mocked(siteSettingsRepository.findFirst).mockResolvedValue(null)
    vi.mocked(themeRepository.findFirst).mockResolvedValue(null)
    vi.mocked(postRepository.findOldest).mockResolvedValue(null)

    const site = await getSiteConfig()
    expect(site.title).toBe("RLine CMS")
    expect(site.theme).toBe("minimal")
    expect(site.startDate).toBeUndefined()
  })

  it("returns defaultConfig when a dependency throws", async () => {
    vi.mocked(siteSettingsRepository.findFirst).mockRejectedValue(new Error("db down"))
    const site = await getSiteConfig()
    expect(site.title).toBe("RLine CMS")
    expect(console.error).toHaveBeenCalled()
  })
})
