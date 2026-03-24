import { describe, it, expect } from "vitest"
import { calculateReadTime } from "./readTime"

describe("calculateReadTime", () => {
  it("returns at least 1 minute", () => {
    expect(calculateReadTime("")).toBe(1)
    expect(calculateReadTime("hello")).toBe(1)
  })

  it("strips HTML before counting words", () => {
    const html = "<p>" + Array(201).fill("word").join(" ") + "</p>"
    expect(calculateReadTime(html)).toBe(2)
  })

  it("rounds up partial minutes", () => {
    const words = Array(201).fill("w").join(" ")
    expect(calculateReadTime(words)).toBe(2)
  })
})
