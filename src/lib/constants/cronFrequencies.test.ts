import { describe, it, expect } from "vitest"
import {
  getCronExpression,
  getFrequencyLabel,
  getFrequencyFromCronExpression,
} from "./cronFrequencies"

describe("cronFrequencies", () => {
  it("getCronExpression returns custom expression when frequency is custom", () => {
    expect(getCronExpression("custom", "0 9 * * 1")).toBe("0 9 * * 1")
  })

  it("getCronExpression falls back to every minute for unknown preset", () => {
    expect(getCronExpression("custom")).toBe("* * * * *")
  })

  it("getCronExpression maps presets", () => {
    expect(getCronExpression("daily-midnight")).toBe("0 0 * * *")
    expect(getCronExpression("every-5-minutes")).toBe("*/5 * * * *")
  })

  it("getFrequencyLabel resolves known values", () => {
    expect(getFrequencyLabel("every-hour")).toBe("Every hour")
    expect(getFrequencyLabel("custom")).toBe("Custom")
  })

  it("getFrequencyFromCronExpression matches table entries", () => {
    expect(getFrequencyFromCronExpression("0 0 * * *")).toBe("daily-midnight")
    expect(getFrequencyFromCronExpression("*/5 * * * *")).toBe("every-5-minutes")
  })

  it("getFrequencyFromCronExpression drops the sixth cron field before matching", () => {
    expect(getFrequencyFromCronExpression("*/5 * * * * 0")).toBe("every-5-minutes")
  })

  it("getFrequencyFromCronExpression returns custom when unmatched", () => {
    expect(getFrequencyFromCronExpression("59 23 31 12 *")).toBe("custom")
  })
})
