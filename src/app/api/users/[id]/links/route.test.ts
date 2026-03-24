import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { GET, PATCH } from "./route"
import { auth } from "@/lib/auth"
import { profileLinkRepository } from "@/lib/repositories/profileLinkRepository"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/repositories/profileLinkRepository", () => ({
  profileLinkRepository: {
    findByUserId: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

type RouteContext = Parameters<typeof GET>[1]

const buildContext = (id: string): RouteContext => ({
  params: Promise.resolve({ id }),
})

const buildRequest = (method: string, body?: Record<string, unknown>): NextRequest => {
  const init: RequestInit = {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
  }
  return new NextRequest(new Request("http://localhost/api/users/user_123/links", init))
}

describe("/api/users/[id]/links security", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects unauthenticated attempts to inspect another user's links", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const response = await GET(buildRequest("GET"), buildContext("user_123"))

    expect(response?.status).toBe(401)
    expect(profileLinkRepository.findByUserId).not.toHaveBeenCalled()
  })

  it("blocks link edits when the session does not own the link", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "attacker", role: "USER" } } as any)
    vi.mocked(profileLinkRepository.findById).mockResolvedValue({
      id: "link_123",
      userId: "victim",
      title: "Twitter",
      url: "https://twitter.com/intruder",
      order: 1,
    } as any)

    const response = await PATCH(
      buildRequest("PATCH", {
        id: "link_123",
        title: "New Title",
        url: "https://example.com",
        order: 2,
      }),
    )

    expect(response?.status).toBe(403)
    expect(profileLinkRepository.update).not.toHaveBeenCalled()
  })
})
