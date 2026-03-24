import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  getCmsPublicOrigin,
  toAbsoluteMediaUrl,
  withAbsoluteScreenshotUrls,
} from "./absoluteMediaUrl"

describe("getCmsPublicOrigin", () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env }
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.VERCEL_URL
  })

  afterEach(() => {
    process.env = env
  })

  it("prefers NEXT_PUBLIC_APP_URL without trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com/"
    const req = new Request("http://localhost:3000/foo")
    expect(getCmsPublicOrigin(req)).toBe("https://example.com")
  })

  it("uses VERCEL_URL when app URL is unset", () => {
    process.env.VERCEL_URL = "my-app.vercel.app"
    const req = new Request("http://localhost:3000/")
    expect(getCmsPublicOrigin(req)).toBe("https://my-app.vercel.app")
  })

  it("falls back to request origin", () => {
    const req = new Request("https://cms.test/path")
    expect(getCmsPublicOrigin(req)).toBe("https://cms.test")
  })
})

describe("toAbsoluteMediaUrl", () => {
  const origin = "https://site.example"

  it("returns empty trimmed string", () => {
    expect(toAbsoluteMediaUrl("  ", origin)).toBe("")
  })

  it("leaves absolute http(s) and data URLs unchanged", () => {
    expect(toAbsoluteMediaUrl("https://cdn/x.png", origin)).toBe("https://cdn/x.png")
    expect(toAbsoluteMediaUrl("data:image/png;base64,xx", origin)).toBe("data:image/png;base64,xx")
  })

  it("prefixes protocol for protocol-relative URLs", () => {
    expect(toAbsoluteMediaUrl("//cdn/img.jpg", "https://a.com")).toBe("https://cdn/img.jpg")
  })

  it("joins relative paths to origin", () => {
    expect(toAbsoluteMediaUrl("/uploads/a.webp", origin)).toBe("https://site.example/uploads/a.webp")
    expect(toAbsoluteMediaUrl("uploads/a.webp", origin)).toBe("https://site.example/uploads/a.webp")
  })

  it("strips trailing slash from origin once", () => {
    expect(toAbsoluteMediaUrl("/x", "https://site.example/")).toBe("https://site.example/x")
  })
})

describe("withAbsoluteScreenshotUrls", () => {
  const origin = "https://api.example"

  it("returns non-objects unchanged", () => {
    expect(withAbsoluteScreenshotUrls(null, origin)).toBe(null)
    expect(withAbsoluteScreenshotUrls("x" as unknown as null, origin)).toBe("x")
  })

  it("returns product when screenshots missing or not an array", () => {
    const p = { id: "1", name: "App" }
    expect(withAbsoluteScreenshotUrls(p, origin)).toBe(p)
    expect(withAbsoluteScreenshotUrls({ ...p, screenshots: "nope" }, origin)).toEqual({
      ...p,
      screenshots: "nope",
    })
  })

  it("rewrites screenshot url strings", () => {
    const product = {
      id: "1",
      screenshots: [{ url: "/a.png" }, { url: "https://x/y.png" }],
    }
    const out = withAbsoluteScreenshotUrls(product, origin)
    expect(out.screenshots).toEqual([
      { url: "https://api.example/a.png" },
      { url: "https://x/y.png" },
    ])
  })
})
