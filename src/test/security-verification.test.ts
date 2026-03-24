import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"

const mockAuth = vi.hoisted(() => vi.fn<() => Promise<Session | null>>())

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}))

vi.mock("@/lib/auth/createUser", () => ({
  createUser: vi.fn(),
}))

vi.mock("@/lib/repositories/userRepository", () => ({
  userRepository: {
    findAll: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock("@/lib/auth/validation", () => ({
  registrationSchema: { parseAsync: vi.fn() },
  getValidationErrorMessage: vi.fn(),
}))

import { GET as UsersGET } from "../app/api/users/route"
import { GET as ThemesGET } from "../app/api/themes/route"
import { auth } from "@/lib/auth"

describe("Security Checks", () => {
  beforeEach(() => {
    mockAuth.mockReset()
  })

  it("should block unauthenticated access to /api/users", async () => {
    mockAuth.mockResolvedValue(null)

    const response = await UsersGET()
    expect(response.status).toBe(401)
  })

  it("should block non-admin access to /api/users", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { role: "USER", id: "1", email: "test@example.com" },
      expires: "2025-01-01",
    } as any)

    const response = await UsersGET()
    expect(response.status).toBe(401)
  })

  it("should allow admin access to /api/users", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { role: "ADMIN", id: "1", email: "admin@example.com" },
      expires: "2025-01-01",
    } as any)

    const response = await UsersGET()
    expect(response.status).not.toBe(401)
  })

  it("should block unauthenticated access to /api/themes", async () => {
    mockAuth.mockResolvedValue(null)
    const response = await ThemesGET()
    expect(response.status).toBe(401)
  })
})
