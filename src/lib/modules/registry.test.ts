import { describe, it, expect, vi, beforeEach } from "vitest"
import { getEnabledModuleIds } from "./registry"
import { siteSettingsRepository } from "@/lib/repositories/siteSettingsRepository"

vi.mock("@/lib/repositories/siteSettingsRepository", () => ({
  siteSettingsRepository: {
    getEnabledModules: vi.fn(),
  },
}))

describe("getEnabledModuleIds", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("when no site settings row (null), intersects discovered modules with empty default set", async () => {
    vi.mocked(siteSettingsRepository.getEnabledModules).mockResolvedValue(null)
    await expect(getEnabledModuleIds()).resolves.toEqual([])
  })

  it("returns stored list when settings exist", async () => {
    vi.mocked(siteSettingsRepository.getEnabledModules).mockResolvedValue(["updates"])
    await expect(getEnabledModuleIds()).resolves.toEqual(["updates"])
  })
})
