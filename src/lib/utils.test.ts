import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { cn, generateRandomToken } from "./utils"

describe("cn", () => {
  it("merges class names and resolves tailwind conflicts", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "block")).toBe("base block")
  })
})

describe("generateRandomToken", () => {
  const originalGetRandomValues = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto)

  beforeEach(() => {
    let i = 0
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((arr) => {
      const a = arr as Uint8Array
      for (let j = 0; j < a.length; j++) {
        a[j] = (i++ % 256) as number
      }
      return arr
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalGetRandomValues) {
      globalThis.crypto.getRandomValues = originalGetRandomValues
    }
  })

  it("returns a hex string of twice the byte length by default", () => {
    const t = generateRandomToken(48)
    expect(t).toMatch(/^[0-9a-f]{96}$/)
  })

  it("respects custom length", () => {
    expect(generateRandomToken(4)).toHaveLength(8)
  })
})
