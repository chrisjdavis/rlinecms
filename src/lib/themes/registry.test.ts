import { describe, it, expect, vi, beforeEach } from "vitest"
import { getEnabledThemeIds } from "./registry"
import { discoverThemes } from "./discovery"
import { siteSettingsRepository } from "@/lib/repositories/siteSettingsRepository"

vi.mock("./discovery", () => ({
  discoverThemes: vi.fn(),
}))

vi.mock("@/lib/repositories/siteSettingsRepository", () => ({
  siteSettingsRepository: {
    getEnabledThemes: vi.fn(),
  },
}))

describe("getEnabledThemeIds", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(discoverThemes).mockResolvedValue([
      { id: "minimal", name: "Minimal" },
      { id: "other", name: "Other" },
    ])
  })

  it("when stored is null, returns all discovered theme ids", async () => {
    vi.mocked(siteSettingsRepository.getEnabledThemes).mockResolvedValue(null)
    await expect(getEnabledThemeIds()).resolves.toEqual(["minimal", "other"])
  })

  it("when stored is an explicit list, returns that list", async () => {
    vi.mocked(siteSettingsRepository.getEnabledThemes).mockResolvedValue(["minimal"])
    await expect(getEnabledThemeIds()).resolves.toEqual(["minimal"])
    expect(discoverThemes).not.toHaveBeenCalled()
  })
})
