import { describe, it, expect } from "vitest"
import { generateToken } from "./tokens"

describe("generateToken", () => {
  it("resolves to hex string of double the byte length", async () => {
    const t = await generateToken(8)
    expect(t).toMatch(/^[0-9a-f]{16}$/)
  })

  it("uses default length 32 bytes", async () => {
    const t = await generateToken()
    expect(t).toHaveLength(64)
  })
})
