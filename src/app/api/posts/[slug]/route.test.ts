import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Session } from "next-auth"
import type { Post } from "@prisma/client"
import { Role, Status } from "@prisma/client"
import type { NextRequest } from "next/server"
import { DELETE } from "./route"
import { auth } from "@/lib/auth"
import { postRepository } from "@/lib/repositories/postRepository"
import { logUserActivity } from "@/lib/activityLog"
import { logger } from "@/lib/logger"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/repositories/postRepository", () => ({
  postRepository: {
    findBySlug: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock("@/lib/activityLog", () => ({
  logUserActivity: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}))

type DeleteContext = { params: Promise<{ slug: string }> }

type AuthSession = Awaited<ReturnType<typeof auth>>

const buildSession = (overrides: Partial<Session["user"]> = {}): AuthSession => ({
  user: {
    id: "user-id",
    email: "user@example.com",
    role: Role.USER,
    name: "Test User",
    ...overrides,
  },
  expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
}) as any

const buildPost = (overrides: Partial<Post> = {}): Post => ({
  id: "post-id",
  title: "Test Post",
  slug: "test-post",
  excerpt: null,
  status: Status.DRAFT,
  authorId: "author-id",
  createdAt: new Date(),
  updatedAt: new Date(),
  content: {},
  version: 1,
  scheduledAt: null,
  ...overrides,
})

const buildRequest = (url: string): NextRequest => {
  const request = new Request(url, { method: "DELETE" })
  return Object.assign(request, { ip: "127.0.0.1" }) as unknown as NextRequest
}

describe("DELETE /api/posts/[slug]", () => {
  const buildContext = (slug: string): DeleteContext => ({
    params: Promise.resolve({ slug }),
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects deletion when the user is not the owner or an admin", async () => {
    const request = buildRequest("http://localhost/api/posts/test-post")
    const context = buildContext("test-post")

    vi.mocked(auth).mockResolvedValue(
      buildSession({
        id: "user-2",
        role: Role.USER,
      }) as any,
    )

    vi.mocked(postRepository.findBySlug).mockResolvedValue(
      buildPost({
        id: "post-1",
        authorId: "user-1",
      }),
    )

    const response = await DELETE(request, context)

    expect(response.status).toBe(403)
    expect(postRepository.delete).not.toHaveBeenCalled()
    expect(logUserActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "POST_DELETE_UNAUTHORIZED",
        userId: "user-2",
      }),
    )
    expect(logger.warn).toHaveBeenCalled()
  })

  it("allows the post owner to delete their post", async () => {
    const request = buildRequest("http://localhost/api/posts/owner-post")
    const context = buildContext("owner-post")

    vi.mocked(auth).mockResolvedValue(
      buildSession({
        id: "owner-1",
        role: Role.USER,
      }) as any,
    )

    vi.mocked(postRepository.findBySlug).mockResolvedValue(
      buildPost({
        id: "post-1",
        authorId: "owner-1",
        slug: "owner-post",
      }),
    )

    vi.mocked(postRepository.delete).mockResolvedValue(
      buildPost({
        id: "post-1",
        authorId: "owner-1",
      }),
    )

    const response = await DELETE(request, context)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(postRepository.delete).toHaveBeenCalledWith("post-1")
    expect(logUserActivity).not.toHaveBeenCalled()
  })

  it("allows admins to delete posts they do not own", async () => {
    const request = buildRequest("http://localhost/api/posts/other-post")
    const context = buildContext("other-post")

    vi.mocked(auth).mockResolvedValue(
      buildSession({
        id: "admin-1",
        role: Role.ADMIN,
      }) as any,
    )

    vi.mocked(postRepository.findBySlug).mockResolvedValue(
      buildPost({
        id: "post-2",
        authorId: "writer-1",
        slug: "other-post",
      }),
    )

    vi.mocked(postRepository.delete).mockResolvedValue(
      buildPost({
        id: "post-2",
        authorId: "writer-1",
      }),
    )

    const response = await DELETE(request, context)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true })
    expect(postRepository.delete).toHaveBeenCalledWith("post-2")
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logUserActivity).not.toHaveBeenCalled()
  })
})
