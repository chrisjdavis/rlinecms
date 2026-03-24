import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}))

import { getToken } from "next-auth/jwt"
import middleware from "./middleware"

function makeRequest(pathname: string) {
  return {
    nextUrl: { pathname },
    url: `http://localhost${pathname}`,
    headers: new Headers({
      cookie: "next-auth.session-token=forged",
    }),
  } as any
}

describe("middleware authz", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("should reject forged/unsigned session cookies for admin UI routes", async () => {
    vi.mocked(getToken).mockResolvedValue(null)

    const req = makeRequest("/admin/settings")
    const res = await middleware(req)

    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("http://localhost/login")
    expect(getToken).toHaveBeenCalledOnce()
  })

  it("should reject non-admin user for admin UI routes", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: "u1", role: "USER" } as any)

    const req = makeRequest("/admin/settings")
    const res = await middleware(req)

    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("http://localhost/login")
  })

  it("should reject non-moderator user for moderator UI routes", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: "u1", role: "USER" } as any)

    const req = makeRequest("/admin/comments")
    const res = await middleware(req)

    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("http://localhost/login")
  })

  it("should allow moderator for moderator UI routes", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: "u1", role: "COMMENTER" } as any)

    const req = makeRequest("/admin/comments")
    const res = await middleware(req)

    expect(res.status).toBe(200)
  })

  it("should allow admin for moderator UI routes", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: "u1", role: "ADMIN" } as any)

    const req = makeRequest("/admin/comments")
    const res = await middleware(req)

    expect(res.status).toBe(200)
  })

  it("should reject forged cookies for admin API routes", async () => {
    vi.mocked(getToken).mockResolvedValue(null)

    const req = makeRequest("/api/admin/users")
    const res = await middleware(req)

    expect(res.status).toBe(401)
  })

  it("should allow unauthenticated access to /login", async () => {
    vi.mocked(getToken).mockResolvedValue(null)
    const req = makeRequest("/login")
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it("should allow unauthenticated access to public /api/posts", async () => {
    vi.mocked(getToken).mockResolvedValue(null)
    const req = makeRequest("/api/posts")
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })

  it("should require admin for /admin/setup", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: "u1", role: "USER" } as any)
    const req = makeRequest("/admin/setup")
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/login")
  })

  it("should allow admin for /admin/setup", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: "u1", role: "ADMIN" } as any)
    const req = makeRequest("/admin/setup")
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })
})
