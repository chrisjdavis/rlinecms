import { describe, it, expect } from "vitest"
import { generateThemeCSS, defaultThemeConfig } from "./theme"

describe("generateThemeCSS", () => {
  it("includes CSS variables from config", () => {
    const css = generateThemeCSS(defaultThemeConfig)
    expect(css).toContain("--color-primary:")
    expect(css).toContain(defaultThemeConfig.colors.primary)
    expect(css).toContain("--font-heading:")
    expect(css).toContain("--container-max-width:")
  })
})
