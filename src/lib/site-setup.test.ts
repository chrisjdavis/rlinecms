import { describe, it, expect, vi, beforeEach } from "vitest"

const prismaSiteSettingsMock = vi.hoisted(() => ({
  findFirst: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    siteSettings: prismaSiteSettingsMock,
  },
}))

import { isFirstRunSetupRequired } from "./site-setup"

describe("isFirstRunSetupRequired", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns true when no site settings exist", async () => {
    prismaSiteSettingsMock.findFirst.mockResolvedValue(null)
    await expect(isFirstRunSetupRequired()).resolves.toBe(true)
    expect(prismaSiteSettingsMock.findFirst).toHaveBeenCalledWith({
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    })
  })

  it("returns false when a row exists", async () => {
    prismaSiteSettingsMock.findFirst.mockResolvedValue({ id: "s1" })
    await expect(isFirstRunSetupRequired()).resolves.toBe(false)
  })
})
