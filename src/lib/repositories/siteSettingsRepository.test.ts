import { describe, it, expect, vi, beforeEach } from "vitest"

const prismaMock = vi.hoisted(() => ({
  siteSettings: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock("../prisma", () => ({
  prisma: prismaMock,
}))

import { siteSettingsRepository } from "./siteSettingsRepository"

describe("siteSettingsRepository helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getEnabledModules", () => {
    it("returns null when no settings row", async () => {
      prismaMock.siteSettings.findFirst.mockResolvedValue(null)
      await expect(siteSettingsRepository.getEnabledModules()).resolves.toBeNull()
    })

    it("returns empty array when json is null", async () => {
      prismaMock.siteSettings.findFirst.mockResolvedValue({ enabledModules: null })
      await expect(siteSettingsRepository.getEnabledModules()).resolves.toEqual([])
    })

    it("normalizes array json", async () => {
      prismaMock.siteSettings.findFirst.mockResolvedValue({ enabledModules: ["a", "b"] })
      await expect(siteSettingsRepository.getEnabledModules()).resolves.toEqual(["a", "b"])
    })

    it("normalizes comma-separated string", async () => {
      prismaMock.siteSettings.findFirst.mockResolvedValue({ enabledModules: "a, b," })
      await expect(siteSettingsRepository.getEnabledModules()).resolves.toEqual(["a", "b"])
    })
  })

  describe("setEnabledModules", () => {
    it("no-ops when settings missing", async () => {
      prismaMock.siteSettings.findFirst.mockResolvedValue(null)
      await siteSettingsRepository.setEnabledModules(["x"])
      expect(prismaMock.siteSettings.update).not.toHaveBeenCalled()
    })

    it("updates the latest settings row", async () => {
      prismaMock.siteSettings.findFirst.mockResolvedValue({ id: "sid" })
      await siteSettingsRepository.setEnabledModules(["m1"])
      expect(prismaMock.siteSettings.update).toHaveBeenCalledWith({
        where: { id: "sid" },
        data: { enabledModules: ["m1"] },
      })
    })
  })

  describe("getEnabledThemes", () => {
    it("returns null when no settings", async () => {
      prismaMock.siteSettings.findFirst.mockResolvedValue(null)
      await expect(siteSettingsRepository.getEnabledThemes()).resolves.toBeNull()
    })
  })
})
