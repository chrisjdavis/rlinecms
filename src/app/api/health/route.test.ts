import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { GET } from "./route"

const prismaMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  post: { count: vi.fn() },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}))

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns healthy payload when DB succeeds", async () => {
    prismaMock.$queryRaw.mockResolvedValue(undefined)
    prismaMock.post.count.mockResolvedValue(42)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe("healthy")
    expect(body.database).toBe("connected")
    expect(body.postCount).toBe(42)
    expect(body.environment).toBe(process.env.NODE_ENV)
  })

  it("returns 500 when the database fails", async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error("connection refused"))

    const res = await GET()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.status).toBe("unhealthy")
    expect(body.error).toBe("connection refused")
  })
})
