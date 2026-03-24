import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  generateApiKey,
  extractApiKeyFromHeaders,
  validateApiKey,
  validateApiKeyFromRequest,
} from "./apiKey"
import { apiKeyRepository } from "./repositories/apiKeyRepository"

vi.mock("./repositories/apiKeyRepository", () => ({
  apiKeyRepository: {
    findActiveByKey: vi.fn(),
    updateLastUsed: vi.fn().mockResolvedValue(undefined),
  },
}))

describe("generateApiKey", () => {
  it("returns 64 hex chars (32 bytes)", () => {
    const k = generateApiKey()
    expect(k).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe("extractApiKeyFromHeaders", () => {
  it("reads x-api-key first", () => {
    const h = new Headers({
      "x-api-key": "secret-key",
      authorization: "Bearer other",
    })
    expect(extractApiKeyFromHeaders(h)).toBe("secret-key")
  })

  it("parses Bearer authorization", () => {
    const h = new Headers({ authorization: "Bearer   token-value  " })
    expect(extractApiKeyFromHeaders(h)).toBe("token-value")
  })

  it("returns null when absent", () => {
    expect(extractApiKeyFromHeaders(new Headers())).toBe(null)
  })
})

describe("validateApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns null for null key", async () => {
    expect(await validateApiKey(null)).toBeNull()
  })

  it("returns null when repository finds nothing", async () => {
    vi.mocked(apiKeyRepository.findActiveByKey).mockResolvedValue(null)
    expect(await validateApiKey("k")).toBeNull()
  })

  it("returns key row and triggers last-used update", async () => {
    const row = { id: "1", key: "k" } as any
    vi.mocked(apiKeyRepository.findActiveByKey).mockResolvedValue(row)
    const out = await validateApiKey("k")
    expect(out).toBe(row)
    expect(apiKeyRepository.updateLastUsed).toHaveBeenCalledWith("k")
  })
})

describe("validateApiKeyFromRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiKeyRepository.findActiveByKey).mockResolvedValue(null)
  })

  it("uses headers from the request", async () => {
    const req = new Request("http://localhost", {
      headers: { "x-api-key": "abc" },
    })
    await validateApiKeyFromRequest(req)
    expect(apiKeyRepository.findActiveByKey).toHaveBeenCalledWith("abc")
  })
})
