import { describe, it, expect, vi, beforeEach } from "vitest"
import { Role } from "@prisma/client"
import type { JWT } from "next-auth/jwt"

vi.mock("argon2", () => ({}))

describe("Auth Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should have correct session configuration", async () => {
    const { authOptions } = await import("../providers")
    expect(authOptions.session?.strategy).toBe("jwt")
  })

  it("should have correct pages configuration", async () => {
    const { authOptions } = await import("../providers")
    expect(authOptions.pages?.signIn).toBe("/login")
    expect(authOptions.pages?.error).toBe("/login")
    expect(authOptions.pages?.signOut).toBe("/login")
  })

  describe("Credentials Provider", () => {
    it("should validate required credentials", async () => {
      const { authOptions } = await import("../providers")
      const provider: any = authOptions.providers?.[0]

      const result = await provider.authorize({})
      expect(result).toBeNull()
    })

    // NOTE: Full DB + crypto integration is out of scope for this unit test.
    // The credentials provider is covered via integration tests elsewhere.
  })

  describe("Callbacks", () => {
    it("should add token data to session", async () => {
      const { authOptions } = await import("../providers")

      const token = {
        id: "1",
        role: Role.USER,
        email: "test@example.com",
        name: "Test User",
        avatar: "https://example.com/avatar.png",
        emailVerified: null,
      } as JWT & { id: string; role: Role; avatar?: string | null }

      const baseSession: any = {
        user: {
          id: "placeholder",
          email: "placeholder@example.com",
          name: "Placeholder",
          role: Role.USER,
          emailVerified: null,
          avatar: null,
        },
        expires: new Date().toISOString(),
      }

      const sessionCallback: any = authOptions.callbacks?.session
      const result = await sessionCallback({ session: baseSession, token })

      expect(result.user).toEqual(
        expect.objectContaining({
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
          avatar: token.avatar,
          emailVerified: token.emailVerified,
        }),
      )
    })
  })
})
