import { describe, it, expect, vi, beforeEach } from "vitest"
import { Role } from "@prisma/client"
import { GET, PUT } from "./route"
import { auth } from "@/lib/auth"
import { siteSettingsRepository } from "@/lib/repositories/siteSettingsRepository"
import { logUserActivity } from "@/lib/activityLog"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/repositories/siteSettingsRepository", () => ({
  siteSettingsRepository: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock("@/lib/activityLog", () => ({
  logUserActivity: vi.fn(),
}))

const adminSession = {
  user: { id: "admin-1", email: "a@b.com", role: Role.ADMIN, name: "A" },
  expires: new Date(Date.now() + 60_000).toISOString(),
} as any

describe("GET /api/admin/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 without session", async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns settings json", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession)
    vi.mocked(siteSettingsRepository.findFirst).mockResolvedValue({
      id: "s1",
      title: "T",
    } as any)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ id: "s1", title: "T" })
  })
})

describe("PUT /api/admin/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 for non-admin", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: Role.USER },
      expires: adminSession.expires,
    } as any)
    const req = new Request("http://localhost/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ title: "X" }),
    })
    const res = await PUT(req)
    expect(res.status).toBe(401)
  })

  it("returns 400 when no allowed fields in body", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession)
    const req = new Request("http://localhost/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ unknown: 1 }),
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it("creates settings when none exist", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession)
    vi.mocked(siteSettingsRepository.findFirst).mockResolvedValue(null)
    vi.mocked(siteSettingsRepository.create).mockResolvedValue({
      id: "new",
      title: "Hello",
    } as any)

    const req = new Request("http://localhost/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Hello", description: "D" }),
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    expect(siteSettingsRepository.create).toHaveBeenCalled()
    expect(logUserActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "settings_updated",
        userId: "admin-1",
      }),
    )
  })

  it("updates existing settings", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession)
    vi.mocked(siteSettingsRepository.findFirst).mockResolvedValue({
      id: "s1",
      title: "Old",
    } as any)
    vi.mocked(siteSettingsRepository.update).mockResolvedValue({
      id: "s1",
      title: "New",
    } as any)

    const req = new Request("http://localhost/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ title: "New" }),
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    expect(siteSettingsRepository.update).toHaveBeenCalledWith(
      "s1",
      expect.objectContaining({
        title: "New",
        updatedBy: { connect: { id: "admin-1" } },
      }),
    )
  })
})
