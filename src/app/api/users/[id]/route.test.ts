import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { DELETE } from "./route"
import { auth } from "@/lib/auth"
import { userRepository } from "@/lib/repositories/userRepository"
import { logUserActivity } from "@/lib/activityLog"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/repositories/userRepository", () => ({
  userRepository: {
    update: vi.fn(),
  },
}))

vi.mock("@/lib/activityLog", () => ({
  logUserActivity: vi.fn(),
}))

type RouteContext = Parameters<typeof DELETE>[1]
type UpdatedUser = Awaited<ReturnType<typeof userRepository.update>>

const buildRequest = () =>
  new NextRequest(
    new Request("http://localhost/api/users/user_123", { method: "DELETE" }),
  )

const buildContext = (id = "user_123"): RouteContext => ({
  params: Promise.resolve({ id }),
})

describe("DELETE /api/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects unauthenticated sessions", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const response = await DELETE(buildRequest(), buildContext())

    expect(response.status).toBe(401)
    expect(userRepository.update).not.toHaveBeenCalled()
  })

  it("prevents users from deleting other accounts", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_abc", role: "USER" },
    } as any)

    const response = await DELETE(buildRequest(), buildContext("user_123"))

    expect(response.status).toBe(403)
    expect(userRepository.update).not.toHaveBeenCalled()
  })

  it("allows owners to delete their account", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_123", role: "USER" },
    } as any)

    vi.mocked(userRepository.update).mockResolvedValue({ id: "user_123" } as UpdatedUser)

    const response = await DELETE(buildRequest(), buildContext("user_123"))

    expect(response.status).toBe(200)
    expect(userRepository.update).toHaveBeenCalledWith(
      "user_123",
      expect.objectContaining({ deletedAt: expect.any(Date) }),
    )
    expect(logUserActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_123",
        metadata: expect.objectContaining({ targetUserId: "user_123" }),
      }),
    )
  })

  it("allows admins to delete other accounts", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "admin_1", role: "ADMIN" },
    } as any)

    vi.mocked(userRepository.update).mockResolvedValue({ id: "user_123" } as UpdatedUser)

    const response = await DELETE(buildRequest(), buildContext("user_123"))

    expect(response.status).toBe(200)
    expect(userRepository.update).toHaveBeenCalledWith(
      "user_123",
      expect.objectContaining({ deletedAt: expect.any(Date) }),
    )
    expect(logUserActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin_1",
        metadata: expect.objectContaining({ targetUserId: "user_123", actorId: "admin_1" }),
      }),
    )
  })
})
