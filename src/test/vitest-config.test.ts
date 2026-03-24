/* @vitest-environment node */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const configFileUrl = new URL('../../vitest.config.ts', import.meta.url)

describe('vitest configuration', () => {
  it('excludes Next.js build artifacts from test discovery', () => {
    const contents = readFileSync(configFileUrl, 'utf8')
    expect(contents).toContain("'.next/**'")
  })
})
