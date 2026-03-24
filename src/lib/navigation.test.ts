import { describe, it, expect, vi, beforeEach } from "vitest"
import { getNavigation } from "./navigation"
import { siteSettingsRepository } from "./repositories/siteSettingsRepository"

vi.mock("./repositories/siteSettingsRepository", () => ({
  siteSettingsRepository: {
    findFirst: vi.fn(),
  },
}))

describe("getNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns empty header and footer when settings are missing", async () => {
    vi.mocked(siteSettingsRepository.findFirst).mockResolvedValue(null as any)
    await expect(getNavigation()).resolves.toEqual({
      header: [],
      footer: [],
    })
  })

  it("splits items by location", async () => {
    vi.mocked(siteSettingsRepository.findFirst).mockResolvedValue({
      id: "1",
      navigation: [
        { label: "Home", url: "/", order: 0, location: "HEADER" },
        { label: "Blog", url: "/posts", order: 1, location: "HEADER" },
        { label: "©", url: "/legal", order: 0, location: "FOOTER" },
      ],
    } as any)

    const nav = await getNavigation()
    expect(nav.header).toEqual([
      { label: "Home", url: "/", order: 0 },
      { label: "Blog", url: "/posts", order: 1 },
    ])
    expect(nav.footer).toEqual([{ label: "©", url: "/legal", order: 0 }])
  })
})
